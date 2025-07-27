from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import qrcode
import io
import base64
from PIL import Image
import json
import requests
import secrets
import hashlib
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with fallback to in-memory storage
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'wedding_invitations')

# In-memory storage for demo purposes
in_memory_db = {
    'users': {},
    'sessions': {},
    'templates': {},
    'invitations': {},
    'payment_transactions': {}
}

try:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    USE_MONGODB = True
    print("Connected to MongoDB successfully")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    print("Using in-memory storage for demo")
    USE_MONGODB = False

# Create the main app without a prefix
app = FastAPI(title="Wedding Invitation Service")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Base Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    premium: bool = False
    stripe_customer_id: Optional[str] = None
    session_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)

class Template(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    theme: str  # classic, modern, boho
    preview_url: str
    html_content: str
    css_content: str
    is_premium: bool = False
    owner_id: Optional[str] = None  # for custom AI templates
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvitationData(BaseModel):
    bride_name: str
    groom_name: str
    wedding_date: str
    wedding_time: str
    venue_name: str
    venue_address: str
    events: List[Dict[str, str]] = []
    rsvp_link: Optional[str] = None
    additional_message: Optional[str] = None

class Invitation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    template_id: str
    invitation_data: InvitationData
    url_slug: str
    qr_code: Optional[str] = None
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateInvitationRequest(BaseModel):
    template_id: str
    invitation_data: InvitationData

class TemplateCreateRequest(BaseModel):
    name: str
    description: str
    theme: str
    html_content: str
    css_content: str

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    payment_id: Optional[str] = None
    user_id: Optional[str] = None
    email: Optional[str] = None
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"  # pending, paid, failed, expired
    metadata: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Auth Models
class SessionData(BaseModel):
    user_id: str
    expires_at: datetime

# Database operations helper
async def db_insert_one(collection_name: str, document: dict):
    if USE_MONGODB:
        return await db[collection_name].insert_one(document)
    else:
        doc_id = document.get('id', str(uuid.uuid4()))
        in_memory_db[collection_name][doc_id] = document
        return type('MockResult', (), {'inserted_id': doc_id})()

async def db_find_one(collection_name: str, query: dict):
    if USE_MONGODB:
        return await db[collection_name].find_one(query)
    else:
        for doc in in_memory_db[collection_name].values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

async def db_find(collection_name: str, query: dict = None):
    if USE_MONGODB:
        cursor = db[collection_name].find(query or {})
        return await cursor.to_list(1000)
    else:
        if query:
            return [doc for doc in in_memory_db[collection_name].values() 
                   if all(doc.get(k) == v for k, v in query.items())]
        return list(in_memory_db[collection_name].values())

async def db_update_one(collection_name: str, query: dict, update: dict):
    if USE_MONGODB:
        return await db[collection_name].update_one(query, update)
    else:
        for doc_id, doc in in_memory_db[collection_name].items():
            if all(doc.get(k) == v for k, v in query.items()):
                if '$set' in update:
                    doc.update(update['$set'])
                break

async def db_count_documents(collection_name: str, query: dict = None):
    if USE_MONGODB:
        return await db[collection_name].count_documents(query or {})
    else:
        docs = await db_find(collection_name, query)
        return len(docs)

async def db_insert_many(collection_name: str, documents: list):
    if USE_MONGODB:
        return await db[collection_name].insert_many(documents)
    else:
        for doc in documents:
            doc_id = doc.get('id', str(uuid.uuid4()))
            in_memory_db[collection_name][doc_id] = doc

# Utility Functions
def generate_url_slug():
    """Generate a unique URL slug for invitations"""
    return secrets.token_urlsafe(8)

def generate_qr_code(url: str) -> str:
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"

async def get_user_from_session(request: Request):
    """Get user from session token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    
    # Check if session exists and is valid
    session = await db_find_one('sessions', {"token": token})
    if not session or session["expires_at"] < datetime.utcnow():
        return None
    
    # Get user
    user = await db_find_one('users', {"id": session["user_id"]})
    return User(**user) if user else None

# Auth Endpoints
@api_router.post("/auth/google")
async def google_auth(request: Request):
    """Handle Google OAuth authentication"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth API
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = response.json()
        
        # Check if user exists
        existing_user = await db_find_one('users', {"email": user_data["email"]})
        
        if existing_user:
            user = User(**existing_user)
            user.last_login = datetime.utcnow()
            await db_update_one(
                'users',
                {"id": user.id},
                {"$set": user.dict(exclude={"id"})}
            )
        else:
            # Create new user
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture")
            )
            await db_insert_one('users', user.dict())
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        session_data = {
            "token": session_token,
            "user_id": user.id,
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }
        await db_insert_one('sessions', session_data)
        
        return {
            "user": user.dict(),
            "session_token": session_token
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_current_user(user: User = Depends(get_user_from_session)):
    """Get current authenticated user"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# Template Endpoints
@api_router.get("/templates")
async def get_templates():
    """Get all available templates"""
    templates = await db_find('templates')
    return [Template(**template) for template in templates]

@api_router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get specific template by ID"""
    template = await db_find_one('templates', {"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return Template(**template)

@api_router.post("/templates")
async def create_template(
    template_data: TemplateCreateRequest,
    user: User = Depends(get_user_from_session)
):
    """Create a new template (premium users only)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if not user.premium:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    template = Template(
        name=template_data.name,
        description=template_data.description,
        theme=template_data.theme,
        html_content=template_data.html_content,
        css_content=template_data.css_content,
        preview_url=f"/templates/{template_data.theme}/preview",
        is_premium=True,
        owner_id=user.id
    )
    
    await db_insert_one('templates', template.dict())
    return template

# AI Template Generation
@api_router.post("/templates/generate-ai")
async def generate_ai_template(
    request: Request,
    user: User = Depends(get_user_from_session)
):
    """Generate AI-powered wedding invitation template"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if not user.premium:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    body = await request.json()
    keywords = body.get("keywords", "")
    font_style = body.get("font_style", "serif")
    theme = body.get("theme", "classic")
    
    # Call AI API to generate template
    try:
        ai_api_url = os.getenv("AI_API_URL")
        ai_api_key = os.getenv("AI_API_KEY")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {ai_api_key}"
        }
        
        prompt = f"""Create a beautiful wedding invitation template with the following specifications:
        - Keywords: {keywords}
        - Font style: {font_style}
        - Theme: {theme}
        
        Generate HTML and CSS for a wedding invitation that includes placeholders for:
        - {{{{bride_name}}}} and {{{{groom_name}}}}
        - {{{{wedding_date}}}} and {{{{wedding_time}}}}
        - {{{{venue_name}}}} and {{{{venue_address}}}}
        - {{{{qr_code}}}}
        
        Make it elegant, modern, and responsive. Return only clean HTML and CSS code."""
        
        ai_payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        response = requests.post(ai_api_url, headers=headers, json=ai_payload)
        
        if response.status_code == 200:
            ai_response = response.json()
            generated_content = ai_response.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Parse HTML and CSS from AI response
            html_content = generated_content
            css_content = """
            .invitation-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 2rem;
                font-family: 'Playfair Display', serif;
                text-align: center;
            }
            """
            
            # Create new template
            template = Template(
                name=f"AI Generated - {keywords}",
                description=f"AI-generated template with {keywords} theme",
                theme=theme,
                html_content=html_content,
                css_content=css_content,
                preview_url=f"/templates/ai/{uuid.uuid4()}/preview",
                is_premium=True,
                owner_id=user.id
            )
            
            await db_insert_one('templates', template.dict())
            return template
        else:
            raise HTTPException(status_code=500, detail="AI template generation failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation error: {str(e)}")

# Invitation Endpoints
@api_router.post("/invitations")
async def create_invitation(
    invitation_request: CreateInvitationRequest,
    user: User = Depends(get_user_from_session)
):
    """Create a new wedding invitation"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if template exists
    template = await db_find_one('templates', {"id": invitation_request.template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Generate unique URL slug
    url_slug = generate_url_slug()
    while await db_find_one('invitations', {"url_slug": url_slug}):
        url_slug = generate_url_slug()
    
    # Create invitation
    invitation = Invitation(
        user_id=user.id,
        template_id=invitation_request.template_id,
        invitation_data=invitation_request.invitation_data,
        url_slug=url_slug,
        is_published=True
    )
    
    # Generate QR code
    qr_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/i/{url_slug}"
    invitation.qr_code = generate_qr_code(qr_url)
    
    await db_insert_one('invitations', invitation.dict())
    return invitation

@api_router.get("/invitations")
async def get_user_invitations(user: User = Depends(get_user_from_session)):
    """Get current user's invitations"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    invitations = await db_find('invitations', {"user_id": user.id})
    return [Invitation(**inv) for inv in invitations]

@api_router.get("/invitations/{invitation_id}")
async def get_invitation(
    invitation_id: str,
    user: User = Depends(get_user_from_session)
):
    """Get specific invitation"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    invitation = await db_find_one('invitations', {
        "id": invitation_id,
        "user_id": user.id
    })
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    return Invitation(**invitation)

# Public Invitation Display
@api_router.get("/public/invitations/{url_slug}")
async def get_public_invitation(url_slug: str):
    """Get public invitation by URL slug"""
    invitation = await db_find_one('invitations', {
        "url_slug": url_slug,
        "is_published": True
    })
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Get template
    template = await db_find_one('templates', {"id": invitation["template_id"]})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return {
        "invitation": Invitation(**invitation),
        "template": Template(**template)
    }

# Stripe Payment Integration
stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
if stripe_api_key:
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")

@api_router.post("/payments/checkout/session")
async def create_checkout_session(request: Request):
    """Create Stripe checkout session for premium subscription"""
    try:
        body = await request.json()
        host_url = body.get("host_url", "http://localhost:3000")
        
        # Premium package pricing
        amount = 29.99  # $29.99/month for premium features
        currency = "usd"
        
        success_url = f"{host_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/templates"
        
        metadata = {
            "package": "premium",
            "source": "web_checkout"
        }
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=amount,
            currency=currency,
            payment_status="initiated",
            metadata=metadata
        )
        
        await db_insert_one('payment_transactions', transaction.dict())
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get payment status for a checkout session"""
    try:
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction record
        await db_update_one(
            'payment_transactions',
            {"session_id": session_id},
            {"$set": {
                "payment_status": status_response.payment_status,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        # If payment is successful, upgrade user to premium
        if status_response.payment_status == "paid":
            transaction = await db_find_one('payment_transactions', {"session_id": session_id})
            if transaction and transaction.get("user_id"):
                await db_update_one(
                    'users',
                    {"id": transaction["user_id"]},
                    {"$set": {"premium": True}}
                )
        
        return status_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        webhook_response = await stripe_checkout.handle_webhook(
            body, 
            request.headers.get("Stripe-Signature")
        )
        
        if webhook_response.event_type == "checkout.session.completed":
            # Update payment transaction
            await db_update_one(
                'payment_transactions',
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            
            # Upgrade user to premium if payment successful
            if webhook_response.payment_status == "paid":
                transaction = await db_find_one('payment_transactions', {"session_id": webhook_response.session_id})
                if transaction and transaction.get("user_id"):
                    await db_update_one(
                        'users',
                        {"id": transaction["user_id"]},
                        {"$set": {"premium": True}}
                    )
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Initialize default templates
@api_router.post("/init-templates")
async def init_default_templates():
    """Initialize default wedding templates"""
    # Check if templates already exist
    existing = await db_count_documents('templates')
    if existing > 0:
        return {"message": "Templates already initialized"}
    
    default_templates = [
        {
            "id": "classic-elegance",
            "name": "Classic Elegance",
            "description": "Timeless and sophisticated wedding invitation with gold accents",
            "theme": "classic",
            "preview_url": "https://images.unsplash.com/photo-1632610992723-82d7c212f6d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwaW52aXRhdGlvbnxlbnwwfHx8fDE3NTM2MTczODZ8MA&ixlib=rb-4.1.0&q=85",
            "html_content": """
            <div class="invitation-container classic-theme">
                <div class="hero-section">
                    <div class="ornament-top"></div>
                    <h1 class="couple-names">{{bride_name}} & {{groom_name}}</h1>
                    <div class="separator"></div>
                    <h2 class="wedding-date">{{wedding_date}}</h2>
                    <p class="wedding-time">{{wedding_time}}</p>
                    <div class="venue-section">
                        <h3 class="venue-name">{{venue_name}}</h3>
                        <p class="venue-address">{{venue_address}}</p>
                    </div>
                    <div class="qr-code">{{qr_code}}</div>
                    <div class="ornament-bottom"></div>
                </div>
            </div>
            """,
            "css_content": """
            .classic-theme {
                font-family: 'Playfair Display', serif;
                background: linear-gradient(135deg, #f8f6f0 0%, #ffffff 100%);
                color: #1a1a1a;
                text-align: center;
                padding: 4rem 2rem;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .hero-section {
                max-width: 500px;
                width: 100%;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 20px;
                padding: 3rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            }
            .ornament-top, .ornament-bottom {
                width: 60px;
                height: 60px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d4af37"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') center/contain no-repeat;
                margin: 0 auto 2rem;
            }
            .ornament-bottom {
                margin: 2rem auto 0;
            }
            .couple-names {
                font-size: 2.5rem;
                font-weight: 300;
                letter-spacing: 3px;
                margin-bottom: 1.5rem;
                color: #1a1a1a;
            }
            .separator {
                width: 80px;
                height: 2px;
                background: #d4af37;
                margin: 1.5rem auto;
            }
            .wedding-date {
                font-size: 1.6rem;
                font-weight: 400;
                letter-spacing: 2px;
                margin-bottom: 0.5rem;
                color: #333;
            }
            .wedding-time {
                font-size: 1.2rem;
                font-weight: 300;
                color: #666;
                margin-bottom: 2rem;
            }
            .venue-section {
                margin-bottom: 2rem;
            }
            .venue-name {
                font-size: 1.4rem;
                font-weight: 500;
                color: #1a1a1a;
                margin-bottom: 0.5rem;
            }
            .venue-address {
                font-size: 1rem;
                color: #666;
                line-height: 1.4;
            }
            .qr-code img {
                width: 120px;
                height: 120px;
                border-radius: 10px;
                margin-top: 1rem;
            }
            """,
            "is_premium": False,
            "owner_id": None,
            "created_at": datetime.utcnow()
        },
        {
            "id": "modern-minimalist",
            "name": "Modern Minimalist",
            "description": "Clean and contemporary design with bold typography",
            "theme": "modern",
            "preview_url": "https://images.unsplash.com/photo-1721176487015-5408ae0e9bc2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHx3ZWRkaW5nJTIwaW52aXRhdGlvbnxlbnwwfHx8fDE3NTM2MTczODZ8MA&ixlib=rb-4.1.0&q=85",
            "html_content": """
            <div class="invitation-container modern-theme">
                <div class="hero-section">
                    <div class="geometric-pattern"></div>
                    <h1 class="couple-names">{{bride_name}} & {{groom_name}}</h1>
                    <div class="separator"></div>
                    <h2 class="wedding-date">{{wedding_date}}</h2>
                    <p class="wedding-time">{{wedding_time}}</p>
                    <div class="venue-section">
                        <h3 class="venue-name">{{venue_name}}</h3>
                        <p class="venue-address">{{venue_address}}</p>
                    </div>
                    <div class="qr-code">{{qr_code}}</div>
                </div>
            </div>
            """,
            "css_content": """
            .modern-theme {
                font-family: 'Montserrat', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #2c2c2c;
                text-align: center;
                padding: 4rem 2rem;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .hero-section {
                max-width: 500px;
                width: 100%;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 25px;
                padding: 3rem;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
                position: relative;
                overflow: hidden;
            }
            .geometric-pattern {
                position: absolute;
                top: -50px;
                right: -50px;
                width: 100px;
                height: 100px;
                background: linear-gradient(45deg, #ff6b6b, #ffa726);
                transform: rotate(45deg);
                opacity: 0.1;
            }
            .couple-names {
                font-size: 2.8rem;
                font-weight: 600;
                letter-spacing: -1px;
                margin-bottom: 1.5rem;
                color: #2c2c2c;
            }
            .separator {
                width: 60px;
                height: 3px;
                background: #ff6b6b;
                margin: 1.5rem auto;
                border-radius: 2px;
            }
            .wedding-date {
                font-size: 1.4rem;
                font-weight: 500;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
                color: #2c2c2c;
            }
            .wedding-time {
                font-size: 1.1rem;
                font-weight: 400;
                color: #666;
                margin-bottom: 2rem;
            }
            .venue-section {
                margin-bottom: 2rem;
            }
            .venue-name {
                font-size: 1.3rem;
                font-weight: 600;
                color: #2c2c2c;
                margin-bottom: 0.5rem;
            }
            .venue-address {
                font-size: 1rem;
                color: #666;
                line-height: 1.4;
            }
            .qr-code img {
                width: 120px;
                height: 120px;
                border-radius: 15px;
                border: 3px solid #ff6b6b;
                margin-top: 1rem;
            }
            """,
            "is_premium": False,
            "owner_id": None,
            "created_at": datetime.utcnow()
        },
        {
            "id": "boho-chic",
            "name": "Boho Chic",
            "description": "Bohemian style with earthy tones and flowing typography",
            "theme": "boho",
            "preview_url": "https://images.pexels.com/photos/262023/pexels-photo-262023.jpeg",
            "html_content": """
            <div class="invitation-container boho-theme">
                <div class="hero-section">
                    <div class="floral-border"></div>
                    <h1 class="couple-names">{{bride_name}} & {{groom_name}}</h1>
                    <div class="separator"></div>
                    <h2 class="wedding-date">{{wedding_date}}</h2>
                    <p class="wedding-time">{{wedding_time}}</p>
                    <div class="venue-section">
                        <h3 class="venue-name">{{venue_name}}</h3>
                        <p class="venue-address">{{venue_address}}</p>
                    </div>
                    <div class="qr-code">{{qr_code}}</div>
                </div>
            </div>
            """,
            "css_content": """
            .boho-theme {
                font-family: 'Dancing Script', cursive;
                background: linear-gradient(135deg, #d7ccc8 0%, #f4f1e8 100%);
                color: #5d4037;
                text-align: center;
                padding: 4rem 2rem;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .hero-section {
                max-width: 500px;
                width: 100%;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 30px;
                padding: 3rem;
                box-shadow: 0 20px 60px rgba(139, 69, 19, 0.1);
                position: relative;
                border: 2px solid #cd853f;
            }
            .floral-border {
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                height: 20px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" fill="%23cd853f"><circle cx="20" cy="10" r="3"/><circle cx="50" cy="10" r="5"/><circle cx="80" cy="10" r="3"/></svg>') center/contain no-repeat;
            }
            .couple-names {
                font-size: 3.2rem;
                font-weight: 600;
                letter-spacing: 2px;
                margin-bottom: 1.5rem;
                color: #8b4513;
            }
            .separator {
                width: 100px;
                height: 2px;
                background: #cd853f;
                margin: 1.5rem auto;
                border-radius: 1px;
            }
            .wedding-date {
                font-family: 'Lato', sans-serif;
                font-size: 1.4rem;
                font-weight: 400;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
                color: #5d4037;
            }
            .wedding-time {
                font-family: 'Lato', sans-serif;
                font-size: 1.1rem;
                font-weight: 300;
                color: #8d6e63;
                margin-bottom: 2rem;
            }
            .venue-section {
                margin-bottom: 2rem;
            }
            .venue-name {
                font-family: 'Lato', sans-serif;
                font-size: 1.3rem;
                font-weight: 500;
                color: #5d4037;
                margin-bottom: 0.5rem;
            }
            .venue-address {
                font-family: 'Lato', sans-serif;
                font-size: 1rem;
                color: #8d6e63;
                line-height: 1.4;
            }
            .qr-code img {
                width: 120px;
                height: 120px;
                border-radius: 20px;
                border: 2px solid #cd853f;
                margin-top: 1rem;
            }
            """,
            "is_premium": False,
            "owner_id": None,
            "created_at": datetime.utcnow()
        },
        {
            "id": "floral-romance",
            "name": "Floral Romance",
            "description": "Romantic floral design with soft pink accents",
            "theme": "floral",
            "preview_url": "https://images.pexels.com/photos/2395249/pexels-photo-2395249.jpeg",
            "html_content": """
            <div class="invitation-container floral-theme">
                <div class="hero-section">
                    <div class="floral-header"></div>
                    <h1 class="couple-names">{{bride_name}} & {{groom_name}}</h1>
                    <div class="separator"></div>
                    <h2 class="wedding-date">{{wedding_date}}</h2>
                    <p class="wedding-time">{{wedding_time}}</p>
                    <div class="venue-section">
                        <h3 class="venue-name">{{venue_name}}</h3>
                        <p class="venue-address">{{venue_address}}</p>
                    </div>
                    <div class="qr-code">{{qr_code}}</div>
                    <div class="floral-footer"></div>
                </div>
            </div>
            """,
            "css_content": """
            .floral-theme {
                font-family: 'Playfair Display', serif;
                background: linear-gradient(135deg, #fce4ec 0%, #ffffff 100%);
                color: #4a148c;
                text-align: center;
                padding: 4rem 2rem;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .hero-section {
                max-width: 500px;
                width: 100%;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 25px;
                padding: 3rem;
                box-shadow: 0 20px 60px rgba(233, 30, 99, 0.1);
                position: relative;
                border: 1px solid #f8bbd9;
            }
            .floral-header, .floral-footer {
                width: 120px;
                height: 30px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 30" fill="%23e91e63"><path d="M10 15c0-5 5-10 10-10s10 5 10 10-5 10-10 10-10-5-10-10z M50 10c0-3 3-6 6-6s6 3 6 6-3 6-6 6-6-3-6-6z M90 20c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8z"/></svg>') center/contain no-repeat;
                margin: 0 auto 2rem;
            }
            .floral-footer {
                margin: 2rem auto 0;
            }
            .couple-names {
                font-size: 2.8rem;
                font-weight: 400;
                letter-spacing: 2px;
                margin-bottom: 1.5rem;
                color: #4a148c;
            }
            .separator {
                width: 80px;
                height: 2px;
                background: #e91e63;
                margin: 1.5rem auto;
                border-radius: 1px;
            }
            .wedding-date {
                font-size: 1.5rem;
                font-weight: 400;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
                color: #6a1b99;
            }
            .wedding-time {
                font-size: 1.1rem;
                font-weight: 300;
                color: #8e24aa;
                margin-bottom: 2rem;
            }
            .venue-section {
                margin-bottom: 2rem;
            }
            .venue-name {
                font-size: 1.3rem;
                font-weight: 500;
                color: #4a148c;
                margin-bottom: 0.5rem;
            }
            .venue-address {
                font-size: 1rem;
                color: #8e24aa;
                line-height: 1.4;
            }
            .qr-code img {
                width: 120px;
                height: 120px;
                border-radius: 15px;
                border: 2px solid #e91e63;
                margin-top: 1rem;
            }
            """,
            "is_premium": False,
            "owner_id": None,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db_insert_many('templates', default_templates)
    return {"message": "Default templates initialized", "count": len(default_templates)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if USE_MONGODB:
        client.close()