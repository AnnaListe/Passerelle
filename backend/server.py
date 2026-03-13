from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional
from auth import get_current_user, create_access_token, get_password_hash, verify_password
from models import *
import demo_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize demo data
async def init_demo_data():
    """Initialize demo data if database is empty"""
    try:
        # Check if data exists
        pro_count = await db.professionals.count_documents({})
        if pro_count > 0:
            logger.info("Demo data already exists")
            return
        
        logger.info("Initializing demo data...")
        
        # Hash password for demo professional
        demo_data.demo_professional["password_hash"] = get_password_hash(demo_data.CURRENT_PROFESSIONAL_PASSWORD)
        
        # Insert data
        await db.professionals.insert_one(demo_data.demo_professional)
        await db.professionals.insert_many(demo_data.other_professionals)
        await db.parents.insert_many(demo_data.parents)
        await db.children.insert_many(demo_data.children)
        await db.children_schooling.insert_many(demo_data.children_schooling)
        await db.child_professional_links.insert_many(demo_data.child_professional_links)
        await db.medical_profiles.insert_many(demo_data.medical_profiles)
        await db.communication_profiles.insert_many(demo_data.communication_profiles)
        await db.goals.insert_many(demo_data.goals)
        await db.additional_infos.insert_many(demo_data.additional_infos)
        await db.family_contacts.insert_many(demo_data.family_contacts)
        await db.weekly_schedules.insert_many(demo_data.weekly_schedules)
        await db.appointments.insert_many(demo_data.appointments)
        await db.conversations.insert_many(demo_data.conversations)
        await db.messages.insert_many(demo_data.messages)
        await db.professional_conversations.insert_many(demo_data.professional_conversations)
        await db.professional_messages.insert_many(demo_data.professional_messages)
        await db.documents.insert_many(demo_data.documents)
        await db.invoices.insert_many(demo_data.invoices)
        await db.contracts.insert_many(demo_data.contracts)
        await db.quotes.insert_many(demo_data.quotes)
        
        logger.info("Demo data initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing demo data: {e}")

@app.on_event("startup")
async def startup_event():
    await init_demo_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# AUTH ROUTES
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(input_data: LoginInput):
    """Login professional"""
    pro_doc = await db.professionals.find_one({"email": input_data.email}, {"_id": 0})
    if not pro_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    
    password_hash = pro_doc.get("password_hash", "")
    if not verify_password(input_data.password, password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    
    # Create token
    token = create_access_token(data={"sub": pro_doc["id"]})
    
    # Remove password_hash from response
    pro_doc.pop("password_hash", None)
    professional = Professional(**pro_doc)
    
    return LoginResponse(token=token, professional=professional)

@api_router.get("/auth/me", response_model=Professional)
async def get_current_professional(professional_id: str = Depends(get_current_user)):
    """Get current professional info"""
    pro_doc = await db.professionals.find_one({"id": professional_id}, {"_id": 0, "password_hash": 0})
    if not pro_doc:
        raise HTTPException(status_code=404, detail="Professionnel non trouvé")
    return Professional(**pro_doc)

# PROFESSIONAL ROUTES
@api_router.get("/professionals/{professional_id}", response_model=Professional)
async def get_professional(professional_id: str, current_user_id: str = Depends(get_current_user)):
    """Get professional by ID"""
    pro_doc = await db.professionals.find_one({"id": professional_id}, {"_id": 0, "password_hash": 0})
    if not pro_doc:
        raise HTTPException(status_code=404, detail="Professionnel non trouvé")
    return Professional(**pro_doc)

@api_router.put("/professionals/me")
async def update_professional_profile(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    profession: Optional[str] = None,
    specialty: Optional[str] = None,
    phone: Optional[str] = None,
    description: Optional[str] = None,
    professional_id: str = Depends(get_current_user)
):
    """Update professional profile"""
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if first_name is not None:
        update_data["first_name"] = first_name
    if last_name is not None:
        update_data["last_name"] = last_name
    if profession is not None:
        update_data["profession"] = profession
    if specialty is not None:
        update_data["specialty"] = specialty
    if phone is not None:
        update_data["phone"] = phone
    if description is not None:
        update_data["description"] = description
    
    await db.professionals.update_one({"id": professional_id}, {"$set": update_data})
    
    updated_doc = await db.professionals.find_one({"id": professional_id}, {"_id": 0, "password_hash": 0})
    return Professional(**updated_doc)

# CHILDREN ROUTES
@api_router.get("/children", response_model=List[Child])
async def get_children(professional_id: str = Depends(get_current_user)):
    """Get all children followed by current professional"""
    # Get child IDs from links
    links = await db.child_professional_links.find(
        {"professional_id": professional_id, "active": True},
        {"_id": 0}
    ).to_list(1000)
    
    child_ids = [link["child_id"] for link in links]
    
    # Get children
    children_docs = await db.children.find(
        {"id": {"$in": child_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    return [Child(**child) for child in children_docs]

@api_router.get("/children/{child_id}", response_model=ChildDetailResponse)
async def get_child_detail(child_id: str, professional_id: str = Depends(get_current_user)):
    """Get detailed child information"""
    # Verify access
    link = await db.child_professional_links.find_one({
        "child_id": child_id,
        "professional_id": professional_id,
        "active": True
    })
    if not link:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Get child
    child_doc = await db.children.find_one({"id": child_id}, {"_id": 0})
    if not child_doc:
        raise HTTPException(status_code=404, detail="Enfant non trouvé")
    
    # Get related data
    schooling_doc = await db.children_schooling.find_one({"child_id": child_id}, {"_id": 0})
    weekly_schedule_docs = await db.weekly_schedules.find({"child_id": child_id}, {"_id": 0}).to_list(1000)
    medical_doc = await db.medical_profiles.find_one({"child_id": child_id}, {"_id": 0})
    communication_doc = await db.communication_profiles.find_one({"child_id": child_id}, {"_id": 0})
    goals_doc = await db.goals.find_one({"child_id": child_id}, {"_id": 0})
    additional_doc = await db.additional_infos.find_one({"child_id": child_id}, {"_id": 0})
    family_contacts_doc = await db.family_contacts.find_one({"child_id": child_id}, {"_id": 0})
    
    # Get professionals
    pro_links = await db.child_professional_links.find({"child_id": child_id, "active": True}, {"_id": 0}).to_list(1000)
    pro_ids = [link["professional_id"] for link in pro_links]
    professionals_docs = await db.professionals.find({"id": {"$in": pro_ids}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Get parent
    parent_id = demo_data.child_parent_map.get(child_id)
    parent_doc = None
    if parent_id:
        parent_doc = await db.parents.find_one({"id": parent_id}, {"_id": 0})
    
    return ChildDetailResponse(
        child=Child(**child_doc),
        schooling=ChildSchooling(**schooling_doc) if schooling_doc else None,
        weekly_schedule=[ChildWeeklySchedule(**s) for s in weekly_schedule_docs],
        medical_profile=ChildMedicalProfile(**medical_doc) if medical_doc else None,
        communication_profile=ChildCommunicationProfile(**communication_doc) if communication_doc else None,
        goals=ChildGoals(**goals_doc) if goals_doc else None,
        additional_info=ChildAdditionalInfo(**additional_doc) if additional_doc else None,
        family_contacts=FamilyContacts(**family_contacts_doc) if family_contacts_doc else None,
        professionals=[Professional(**p) for p in professionals_docs],
        parent=Parent(**parent_doc) if parent_doc else None
    )

# APPOINTMENTS ROUTES
@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(
    professional_id: str = Depends(get_current_user),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get appointments for professional with optional date filter"""
    query = {"professional_id": professional_id}
    
    if start_date and end_date:
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        query["start_datetime"] = {"$gte": start_dt, "$lte": end_dt}
    
    appointments_docs = await db.appointments.find(query, {"_id": 0}).sort("start_datetime", 1).to_list(1000)
    return [Appointment(**apt) for apt in appointments_docs]

# CONVERSATIONS ROUTES
@api_router.get("/conversations", response_model=List[ConversationWithDetails])
async def get_conversations(professional_id: str = Depends(get_current_user)):
    """Get all conversations with parents"""
    conv_docs = await db.conversations.find(
        {"professional_id": professional_id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(1000)
    
    result = []
    for conv_doc in conv_docs:
        # Get parent
        parent_doc = await db.parents.find_one({"id": conv_doc["parent_id"]}, {"_id": 0})
        # Get child
        child_doc = await db.children.find_one({"id": conv_doc["child_id"]}, {"_id": 0})
        # Get last message
        last_msg_doc = await db.messages.find_one(
            {"conversation_id": conv_doc["id"]},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        # Count unread messages
        unread_count = await db.messages.count_documents({
            "conversation_id": conv_doc["id"],
            "sender_type": "parent",
            "read_at": None
        })
        
        result.append(ConversationWithDetails(
            conversation=Conversation(**conv_doc),
            parent=Parent(**parent_doc) if parent_doc else None,
            child=Child(**child_doc) if child_doc else None,
            last_message=Message(**last_msg_doc) if last_msg_doc else None,
            unread_count=unread_count
        ))
    
    return result

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_conversation_messages(
    conversation_id: str,
    professional_id: str = Depends(get_current_user)
):
    """Get messages for a conversation"""
    # Verify access
    conv = await db.conversations.find_one({
        "id": conversation_id,
        "professional_id": professional_id
    })
    if not conv:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    messages_docs = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return [Message(**msg) for msg in messages_docs]

@api_router.post("/conversations/{conversation_id}/messages", response_model=Message)
async def send_message(
    conversation_id: str,
    content: str,
    professional_id: str = Depends(get_current_user)
):
    """Send a message in a conversation"""
    # Verify access
    conv = await db.conversations.find_one({
        "id": conversation_id,
        "professional_id": professional_id
    })
    if not conv:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Create message
    message = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        sender_type=MessageSenderType.PROFESSIONAL,
        sender_id=professional_id,
        content=content,
        has_attachment=False,
        created_at=datetime.now(timezone.utc),
        read_at=None
    )
    
    # Insert message
    await db.messages.insert_one(message.model_dump())
    
    # Update conversation last_message_at
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message_at": message.created_at}}
    )
    
    return message

# PROFESSIONAL CONVERSATIONS ROUTES
@api_router.get("/professional-conversations", response_model=List[ProfessionalConversationWithDetails])
async def get_professional_conversations(professional_id: str = Depends(get_current_user)):
    """Get all conversations with other professionals"""
    conv_docs = await db.professional_conversations.find(
        {"$or": [{"professional_1_id": professional_id}, {"professional_2_id": professional_id}]},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(1000)
    
    result = []
    for conv_doc in conv_docs:
        # Determine other professional
        other_pro_id = conv_doc["professional_2_id"] if conv_doc["professional_1_id"] == professional_id else conv_doc["professional_1_id"]
        
        # Get other professional
        other_pro_doc = await db.professionals.find_one({"id": other_pro_id}, {"_id": 0, "password_hash": 0})
        # Get child
        child_doc = await db.children.find_one({"id": conv_doc["child_id"]}, {"_id": 0})
        # Get last message
        last_msg_doc = await db.professional_messages.find_one(
            {"professional_conversation_id": conv_doc["id"]},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        # Count unread messages
        unread_count = await db.professional_messages.count_documents({
            "professional_conversation_id": conv_doc["id"],
            "sender_professional_id": {"$ne": professional_id},
            "read_at": None
        })
        
        result.append(ProfessionalConversationWithDetails(
            conversation=ProfessionalConversation(**conv_doc),
            other_professional=Professional(**other_pro_doc) if other_pro_doc else None,
            child=Child(**child_doc) if child_doc else None,
            last_message=ProfessionalMessage(**last_msg_doc) if last_msg_doc else None,
            unread_count=unread_count
        ))
    
    return result

@api_router.get("/professional-conversations/{conversation_id}/messages", response_model=List[ProfessionalMessage])
async def get_professional_conversation_messages(
    conversation_id: str,
    professional_id: str = Depends(get_current_user)
):
    """Get messages for a professional conversation"""
    # Verify access
    conv = await db.professional_conversations.find_one({
        "id": conversation_id,
        "$or": [{"professional_1_id": professional_id}, {"professional_2_id": professional_id}]
    })
    if not conv:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    messages_docs = await db.professional_messages.find(
        {"professional_conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    return [ProfessionalMessage(**msg) for msg in messages_docs]

# DOCUMENTS ROUTES
@api_router.get("/documents", response_model=List[Document])
async def get_documents(
    professional_id: str = Depends(get_current_user),
    child_id: Optional[str] = Query(None)
):
    """Get documents, optionally filtered by child"""
    # Get children IDs the professional has access to
    links = await db.child_professional_links.find(
        {"professional_id": professional_id, "active": True},
        {"_id": 0}
    ).to_list(1000)
    child_ids = [link["child_id"] for link in links]
    
    query = {"child_id": {"$in": child_ids}}
    if child_id:
        if child_id not in child_ids:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        query["child_id"] = child_id
    
    docs = await db.documents.find(query, {"_id": 0}).sort("uploaded_at", -1).to_list(1000)
    return [Document(**doc) for doc in docs]

# INVOICES ROUTES
@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(
    professional_id: str = Depends(get_current_user),
    status_filter: Optional[str] = Query(None)
):
    """Get invoices for professional"""
    query = {"professional_id": professional_id}
    if status_filter:
        query["status"] = status_filter
    
    invoices_docs = await db.invoices.find(query, {"_id": 0}).sort("issue_date", -1).to_list(1000)
    return [Invoice(**inv) for inv in invoices_docs]

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, professional_id: str = Depends(get_current_user)):
    """Get invoice details"""
    invoice_doc = await db.invoices.find_one({
        "id": invoice_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not invoice_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    return Invoice(**invoice_doc)

@api_router.patch("/invoices/{invoice_id}/status")
async def update_invoice_status(
    invoice_id: str,
    status: InvoiceStatus,
    amount_paid: Optional[float] = None,
    payment_method: Optional[str] = None,
    professional_id: str = Depends(get_current_user)
):
    """Update invoice status and payment info"""
    invoice_doc = await db.invoices.find_one({
        "id": invoice_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not invoice_doc:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    
    update_data = {"status": status.value}
    
    if status == InvoiceStatus.PAID and amount_paid is not None:
        update_data["amount_paid"] = amount_paid
        update_data["amount_remaining"] = 0.0
        update_data["payment_date"] = datetime.now(timezone.utc).date().isoformat()
        if payment_method:
            update_data["payment_method"] = payment_method
    elif status == InvoiceStatus.PARTIALLY_PAID and amount_paid is not None:
        total = invoice_doc["amount_total"]
        update_data["amount_paid"] = amount_paid
        update_data["amount_remaining"] = total - amount_paid
        update_data["last_partial_payment_date"] = datetime.now(timezone.utc).date().isoformat()
        if payment_method:
            update_data["payment_method"] = payment_method
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    return {"message": "Statut mis à jour"}

# CONTRACTS ROUTES
@api_router.get("/contracts", response_model=List[Contract])
async def get_contracts(
    professional_id: str = Depends(get_current_user),
    child_id: Optional[str] = Query(None)
):
    """Get contracts for professional"""
    query = {"professional_id": professional_id}
    if child_id:
        query["child_id"] = child_id
    
    contracts_docs = await db.contracts.find(query, {"_id": 0}).to_list(1000)
    return [Contract(**contract) for contract in contracts_docs]

@api_router.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract(contract_id: str, professional_id: str = Depends(get_current_user)):
    """Get contract details"""
    contract_doc = await db.contracts.find_one({
        "id": contract_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    return Contract(**contract_doc)

@api_router.post("/contracts", response_model=Contract)
async def create_contract(
    child_id: str,
    parent_id: str,
    start_date: str,
    billing_mode: str,
    session_price: Optional[float] = None,
    hourly_rate: Optional[float] = None,
    sessions_per_week: Optional[int] = None,
    sessions_per_month: Optional[int] = None,
    session_duration_minutes: Optional[int] = None,
    notes: Optional[str] = None,
    professional_id: str = Depends(get_current_user)
):
    """Create a new contract"""
    contract = Contract(
        id=str(uuid.uuid4()),
        child_id=child_id,
        professional_id=professional_id,
        parent_id=parent_id,
        start_date=start_date,
        end_date=None,
        billing_mode=billing_mode,
        session_price=session_price,
        hourly_rate=hourly_rate,
        sessions_per_week=sessions_per_week,
        sessions_per_month=sessions_per_month,
        session_duration_minutes=session_duration_minutes,
        notes=notes,
        active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    await db.contracts.insert_one(contract.model_dump())
    return contract

@api_router.put("/contracts/{contract_id}", response_model=Contract)
async def update_contract(
    contract_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    billing_mode: Optional[str] = None,
    session_price: Optional[float] = None,
    hourly_rate: Optional[float] = None,
    sessions_per_week: Optional[int] = None,
    sessions_per_month: Optional[int] = None,
    session_duration_minutes: Optional[int] = None,
    notes: Optional[str] = None,
    active: Optional[bool] = None,
    professional_id: str = Depends(get_current_user)
):
    """Update a contract"""
    contract_doc = await db.contracts.find_one({
        "id": contract_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not contract_doc:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    if start_date is not None:
        update_data["start_date"] = start_date
    if end_date is not None:
        update_data["end_date"] = end_date
    if billing_mode is not None:
        update_data["billing_mode"] = billing_mode
    if session_price is not None:
        update_data["session_price"] = session_price
    if hourly_rate is not None:
        update_data["hourly_rate"] = hourly_rate
    if sessions_per_week is not None:
        update_data["sessions_per_week"] = sessions_per_week
    if sessions_per_month is not None:
        update_data["sessions_per_month"] = sessions_per_month
    if session_duration_minutes is not None:
        update_data["session_duration_minutes"] = session_duration_minutes
    if notes is not None:
        update_data["notes"] = notes
    if active is not None:
        update_data["active"] = active
    
    await db.contracts.update_one({"id": contract_id}, {"$set": update_data})
    
    updated_doc = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    return Contract(**updated_doc)

# QUOTES ROUTES
@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes(
    professional_id: str = Depends(get_current_user),
    child_id: Optional[str] = Query(None)
):
    """Get quotes for professional"""
    query = {"professional_id": professional_id}
    if child_id:
        query["child_id"] = child_id
    
    quotes_docs = await db.quotes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Quote(**quote) for quote in quotes_docs]

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str, professional_id: str = Depends(get_current_user)):
    """Get quote details"""
    quote_doc = await db.quotes.find_one({
        "id": quote_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not quote_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    return Quote(**quote_doc)

@api_router.post("/quotes", response_model=Quote)
async def create_quote(
    child_id: str,
    parent_id: str,
    billing_mode: str,
    session_price: Optional[float] = None,
    hourly_rate: Optional[float] = None,
    sessions_per_week: Optional[int] = None,
    sessions_per_month: Optional[int] = None,
    session_duration_minutes: Optional[int] = None,
    description: Optional[str] = None,
    validity_days: int = 30,
    professional_id: str = Depends(get_current_user)
):
    """Create a new quote"""
    # Calculate estimated monthly amount
    estimated_amount = 0.0
    if billing_mode == "par_seance" and session_price:
        estimated_amount = session_price * (sessions_per_month or 12)
    elif billing_mode == "tarif_horaire" and hourly_rate and sessions_per_month and session_duration_minutes:
        hours = session_duration_minutes / 60
        estimated_amount = hourly_rate * hours * sessions_per_month
    
    # Generate quote number
    count = await db.quotes.count_documents({"professional_id": professional_id})
    quote_number = f"DEV-{datetime.now(timezone.utc).year}-{str(count + 1).zfill(3)}"
    
    issue_date = datetime.now(timezone.utc).date()
    validity_date = (datetime.now(timezone.utc) + timedelta(days=validity_days)).date()
    
    quote_doc = {
        "id": str(uuid.uuid4()),
        "child_id": child_id,
        "professional_id": professional_id,
        "parent_id": parent_id,
        "quote_number": quote_number,
        "issue_date": issue_date.isoformat(),
        "validity_date": validity_date.isoformat(),
        "billing_mode": billing_mode,
        "session_price": session_price,
        "hourly_rate": hourly_rate,
        "sessions_per_week": sessions_per_week,
        "sessions_per_month": sessions_per_month,
        "session_duration_minutes": session_duration_minutes,
        "estimated_monthly_amount": estimated_amount,
        "description": description,
        "status": "brouillon",
        "converted_to_contract_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.quotes.insert_one(quote_doc)
    
    # Remove _id for response
    quote_doc.pop("_id", None)
    return Quote(**quote_doc)

@api_router.patch("/quotes/{quote_id}/status")
async def update_quote_status(
    quote_id: str,
    status: QuoteStatus,
    professional_id: str = Depends(get_current_user)
):
    """Update quote status"""
    quote_doc = await db.quotes.find_one({
        "id": quote_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not quote_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"status": status.value, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Statut mis à jour"}

@api_router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(
    quote_id: str,
    billing_mode: Optional[str] = None,
    session_price: Optional[float] = None,
    hourly_rate: Optional[float] = None,
    sessions_per_week: Optional[int] = None,
    sessions_per_month: Optional[int] = None,
    session_duration_minutes: Optional[int] = None,
    description: Optional[str] = None,
    validity_days: Optional[int] = None,
    professional_id: str = Depends(get_current_user)
):
    """Update an existing quote"""
    quote_doc = await db.quotes.find_one({
        "id": quote_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not quote_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Only allow editing draft quotes
    if quote_doc["status"] != "brouillon":
        raise HTTPException(status_code=400, detail="Seuls les devis en brouillon peuvent être modifiés")
    
    update_data = {"updated_at": datetime.now(timezone.utc)}
    
    if billing_mode is not None:
        update_data["billing_mode"] = billing_mode
    if session_price is not None:
        update_data["session_price"] = session_price
    if hourly_rate is not None:
        update_data["hourly_rate"] = hourly_rate
    if sessions_per_week is not None:
        update_data["sessions_per_week"] = sessions_per_week
    if sessions_per_month is not None:
        update_data["sessions_per_month"] = sessions_per_month
    if session_duration_minutes is not None:
        update_data["session_duration_minutes"] = session_duration_minutes
    if description is not None:
        update_data["description"] = description
    if validity_days is not None:
        new_validity_date = (datetime.now(timezone.utc) + timedelta(days=validity_days)).date()
        update_data["validity_date"] = new_validity_date.isoformat()
    
    # Recalculate estimated amount
    mode = billing_mode or quote_doc["billing_mode"]
    sp = session_price if session_price is not None else quote_doc.get("session_price")
    hr = hourly_rate if hourly_rate is not None else quote_doc.get("hourly_rate")
    spm = sessions_per_month if sessions_per_month is not None else quote_doc.get("sessions_per_month")
    sdm = session_duration_minutes if session_duration_minutes is not None else quote_doc.get("session_duration_minutes")
    
    estimated_amount = 0.0
    if mode == "par_seance" and sp:
        estimated_amount = sp * (spm or 12)
    elif mode == "tarif_horaire" and hr and spm and sdm:
        hours = sdm / 60
        estimated_amount = hr * hours * spm
    update_data["estimated_monthly_amount"] = estimated_amount
    
    await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    
    updated_doc = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    return Quote(**updated_doc)

@api_router.post("/quotes/{quote_id}/convert-to-contract", response_model=Contract)
async def convert_quote_to_contract(
    quote_id: str,
    start_date: str,
    notes: Optional[str] = None,
    professional_id: str = Depends(get_current_user)
):
    """Convert a quote to a contract"""
    quote_doc = await db.quotes.find_one({
        "id": quote_id,
        "professional_id": professional_id
    }, {"_id": 0})
    
    if not quote_doc:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    if quote_doc["status"] != "accepte":
        raise HTTPException(status_code=400, detail="Le devis doit être accepté avant conversion")
    
    # Create contract from quote
    contract_data = {
        "id": str(uuid.uuid4()),
        "child_id": quote_doc["child_id"],
        "professional_id": quote_doc["professional_id"],
        "parent_id": quote_doc["parent_id"],
        "quote_id": quote_id,
        "start_date": start_date,  # Keep as string for MongoDB
        "end_date": None,
        "billing_mode": quote_doc["billing_mode"],
        "session_price": quote_doc.get("session_price"),
        "hourly_rate": quote_doc.get("hourly_rate"),
        "sessions_per_week": quote_doc.get("sessions_per_week"),
        "sessions_per_month": quote_doc.get("sessions_per_month"),
        "session_duration_minutes": quote_doc.get("session_duration_minutes"),
        "notes": notes,
        "active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.contracts.insert_one(contract_data)
    
    # Update quote to mark as converted
    await db.quotes.update_one(
        {"id": quote_id},
        {"$set": {"converted_to_contract_id": contract_data["id"], "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Return contract as model for response
    contract_data.pop("_id", None)  # Remove MongoDB _id if present
    return Contract(**contract_data)

# DASHBOARD ROUTE
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(professional_id: str = Depends(get_current_user)):
    """Get dashboard statistics and data"""
    
    # Get upcoming appointments (next 7 days)
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=7)
    appointments_docs = await db.appointments.find({
        "professional_id": professional_id,
        "start_datetime": {"$gte": now, "$lte": end_date},
        "status": "planifie"
    }, {"_id": 0}).sort("start_datetime", 1).limit(5).to_list(1000)
    
    # Get children IDs
    links = await db.child_professional_links.find(
        {"professional_id": professional_id, "active": True},
        {"_id": 0}
    ).to_list(1000)
    child_ids = [link["child_id"] for link in links]
    
    # Get recent children (limit 4)
    children_docs = await db.children.find(
        {"id": {"$in": child_ids}},
        {"_id": 0}
    ).limit(4).to_list(1000)
    
    # Get recent conversations (limit 3)
    conv_docs = await db.conversations.find(
        {"professional_id": professional_id},
        {"_id": 0}
    ).sort("last_message_at", -1).limit(3).to_list(1000)
    
    recent_conversations = []
    for conv_doc in conv_docs:
        parent_doc = await db.parents.find_one({"id": conv_doc["parent_id"]}, {"_id": 0})
        child_doc = await db.children.find_one({"id": conv_doc["child_id"]}, {"_id": 0})
        last_msg_doc = await db.messages.find_one(
            {"conversation_id": conv_doc["id"]},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        unread_count = await db.messages.count_documents({
            "conversation_id": conv_doc["id"],
            "sender_type": "parent",
            "read_at": None
        })
        
        recent_conversations.append(ConversationWithDetails(
            conversation=Conversation(**conv_doc),
            parent=Parent(**parent_doc) if parent_doc else None,
            child=Child(**child_doc) if child_doc else None,
            last_message=Message(**last_msg_doc) if last_msg_doc else None,
            unread_count=unread_count
        ))
    
    # Get recent documents (limit 4)
    docs = await db.documents.find(
        {"child_id": {"$in": child_ids}},
        {"_id": 0}
    ).sort("uploaded_at", -1).limit(4).to_list(1000)
    
    # Get recent invoices (limit 5)
    invoices_docs = await db.invoices.find(
        {"professional_id": professional_id},
        {"_id": 0}
    ).sort("issue_date", -1).limit(5).to_list(1000)
    
    # Count pending and overdue invoices
    pending_count = await db.invoices.count_documents({
        "professional_id": professional_id,
        "status": "en_attente_paiement"
    })
    overdue_count = await db.invoices.count_documents({
        "professional_id": professional_id,
        "status": "impayee"
    })
    
    return DashboardStats(
        upcoming_appointments=[Appointment(**apt) for apt in appointments_docs],
        recent_children=[Child(**child) for child in children_docs],
        recent_messages=recent_conversations,
        recent_documents=[Document(**doc) for doc in docs],
        recent_invoices=[Invoice(**inv) for inv in invoices_docs],
        pending_invoices_count=pending_count,
        overdue_invoices_count=overdue_count
    )

# CHILD CRUD ROUTES
@api_router.post("/children")
async def create_child(
    data: dict,
    professional_id: str = Depends(get_current_user)
):
    """Create a new child with all related data"""
    child_id = f"child-{str(uuid.uuid4())[:8]}"
    
    # Calculate age
    birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    # Create child document
    child_doc = {
        "id": child_id,
        "first_name": data['first_name'],
        "last_name": data['last_name'],
        "birth_date": data['birth_date'],
        "age": age,
        "photo_url": None,
        "address": data.get('address'),
        "housing_type": data.get('housing_type'),
        "own_bedroom": data.get('own_bedroom'),
        "siblings_count": data.get('siblings_count'),
        "parents_separated": data.get('parents_separated'),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.children.insert_one(child_doc)
    
    # Create parent document from family contacts
    family = data.get('family_contacts', {})
    parent_id = f"parent-{str(uuid.uuid4())[:8]}"
    if family.get('parent1_name'):
        parent_doc = {
            "id": parent_id,
            "first_name": family.get('parent1_name', '').split(' ')[0] if family.get('parent1_name') else '',
            "last_name": ' '.join(family.get('parent1_name', '').split(' ')[1:]) if family.get('parent1_name') else '',
            "email": family.get('parent1_email', ''),
            "phone": family.get('parent1_phone'),
            "relationship_to_child": "parent",
            "avatar_url": None
        }
        await db.parents.insert_one(parent_doc)
    
    # Create child-professional link
    link_doc = {
        "id": str(uuid.uuid4()),
        "child_id": child_id,
        "professional_id": professional_id,
        "role_label": "Professionnel principal",
        "active": True
    }
    await db.child_professional_links.insert_one(link_doc)
    
    # Create schooling
    schooling = data.get('schooling', {})
    if schooling:
        schooling_doc = {
            "id": str(uuid.uuid4()),
            "child_id": child_id,
            **schooling
        }
        await db.child_schooling.insert_one(schooling_doc)
    
    # Create weekly schedule
    weekly_schedule = data.get('weekly_schedule', [])
    for entry in weekly_schedule:
        entry_doc = {
            "id": entry.get('id', str(uuid.uuid4())),
            "child_id": child_id,
            "day_of_week": entry['day_of_week'],
            "start_time": entry['start_time'],
            "end_time": entry['end_time'],
            "label": entry['label'],
            "category": entry.get('category', 'autre'),
            "location": entry.get('location'),
            "notes": entry.get('notes'),
            "related_professional_id": None
        }
        await db.child_weekly_schedule.insert_one(entry_doc)
    
    # Create medical profile
    medical = data.get('medical_profile', {})
    if medical:
        medical_doc = {
            "id": str(uuid.uuid4()),
            "child_id": child_id,
            **medical
        }
        await db.child_medical_profiles.insert_one(medical_doc)
    
    # Create communication profile
    comm = data.get('communication_profile', {})
    if comm:
        comm_doc = {
            "id": str(uuid.uuid4()),
            "child_id": child_id,
            **comm
        }
        await db.child_communication_profiles.insert_one(comm_doc)
    
    # Create goals
    goals = data.get('goals', {})
    if goals:
        goals_doc = {
            "id": str(uuid.uuid4()),
            "child_id": child_id,
            **goals
        }
        await db.child_goals.insert_one(goals_doc)
    
    # Create family contacts
    if family:
        contacts_doc = {
            "id": str(uuid.uuid4()),
            "child_id": child_id,
            **family
        }
        await db.family_contacts.insert_one(contacts_doc)
    
    # Create additional info
    additional = data.get('additional_info', {})
    if additional:
        additional_doc = {
            "id": str(uuid.uuid4()),
            "child_id": child_id,
            **additional
        }
        await db.child_additional_info.insert_one(additional_doc)
    
    return {"id": child_id, "message": "Enfant créé avec succès"}

@api_router.put("/children/{child_id}")
async def update_child(
    child_id: str,
    data: dict,
    professional_id: str = Depends(get_current_user)
):
    """Update child and all related data"""
    # Verify access
    link = await db.child_professional_links.find_one({
        "child_id": child_id,
        "professional_id": professional_id
    })
    if not link:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Calculate age
    birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    # Update child
    await db.children.update_one(
        {"id": child_id},
        {"$set": {
            "first_name": data['first_name'],
            "last_name": data['last_name'],
            "birth_date": data['birth_date'],
            "age": age,
            "address": data.get('address'),
            "housing_type": data.get('housing_type'),
            "own_bedroom": data.get('own_bedroom'),
            "siblings_count": data.get('siblings_count'),
            "parents_separated": data.get('parents_separated'),
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Update schooling
    schooling = data.get('schooling', {})
    await db.child_schooling.update_one(
        {"child_id": child_id},
        {"$set": schooling},
        upsert=True
    )
    
    # Update weekly schedule - delete old and insert new
    await db.child_weekly_schedule.delete_many({"child_id": child_id})
    weekly_schedule = data.get('weekly_schedule', [])
    for entry in weekly_schedule:
        entry_doc = {
            "id": entry.get('id', str(uuid.uuid4())),
            "child_id": child_id,
            "day_of_week": entry['day_of_week'],
            "start_time": entry['start_time'],
            "end_time": entry['end_time'],
            "label": entry['label'],
            "category": entry.get('category', 'autre'),
            "location": entry.get('location'),
            "notes": entry.get('notes'),
            "related_professional_id": None
        }
        await db.child_weekly_schedule.insert_one(entry_doc)
    
    # Update other profiles
    medical = data.get('medical_profile', {})
    if medical:
        await db.child_medical_profiles.update_one(
            {"child_id": child_id},
            {"$set": {"child_id": child_id, **medical}},
            upsert=True
        )
    
    comm = data.get('communication_profile', {})
    if comm:
        await db.child_communication_profiles.update_one(
            {"child_id": child_id},
            {"$set": {"child_id": child_id, **comm}},
            upsert=True
        )
    
    goals = data.get('goals', {})
    if goals:
        await db.child_goals.update_one(
            {"child_id": child_id},
            {"$set": {"child_id": child_id, **goals}},
            upsert=True
        )
    
    family = data.get('family_contacts', {})
    if family:
        await db.family_contacts.update_one(
            {"child_id": child_id},
            {"$set": {"child_id": child_id, **family}},
            upsert=True
        )
    
    additional = data.get('additional_info', {})
    if additional:
        await db.child_additional_info.update_one(
            {"child_id": child_id},
            {"$set": {"child_id": child_id, **additional}},
            upsert=True
        )
    
    return {"message": "Enfant mis à jour avec succès"}

# APPOINTMENT ROUTES FOR CHILD PLANNING
@api_router.get("/appointments/child/{child_id}")
async def get_child_appointments(
    child_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    professional_id: str = Depends(get_current_user)
):
    """Get appointments for a specific child"""
    query = {
        "child_id": child_id,
        "professional_id": professional_id
    }
    
    if start_date and end_date:
        query["start_datetime"] = {
            "$gte": datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        }
    
    appointments = await db.appointments.find(query, {"_id": 0}).to_list(100)
    return appointments

@api_router.post("/appointments")
async def create_appointment(
    data: dict,
    professional_id: str = Depends(get_current_user)
):
    """Create a new appointment"""
    appointment_doc = {
        "id": str(uuid.uuid4()),
        "child_id": data['child_id'],
        "professional_id": professional_id,
        "title": data['title'],
        "appointment_type": data.get('appointment_type', 'seance'),
        "start_datetime": datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00')),
        "end_datetime": datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00')),
        "location": data.get('location'),
        "notes": data.get('notes'),
        "status": "planifie"
    }
    await db.appointments.insert_one(appointment_doc)
    appointment_doc.pop("_id", None)
    return appointment_doc

@api_router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    data: dict,
    professional_id: str = Depends(get_current_user)
):
    """Update an appointment"""
    result = await db.appointments.update_one(
        {"id": appointment_id, "professional_id": professional_id},
        {"$set": {
            "title": data['title'],
            "appointment_type": data.get('appointment_type', 'seance'),
            "start_datetime": datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00')),
            "end_datetime": datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00')),
            "location": data.get('location'),
            "notes": data.get('notes'),
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="RDV non trouvé")
    return {"message": "RDV mis à jour"}

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    professional_id: str = Depends(get_current_user)
):
    """Delete an appointment"""
    result = await db.appointments.delete_one({
        "id": appointment_id,
        "professional_id": professional_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RDV non trouvé")
    return {"message": "RDV supprimé"}

# INVOICE CREATION FROM CONTRACT
@api_router.post("/invoices/create-from-contract")
async def create_invoice_from_contract(
    data: dict,
    professional_id: str = Depends(get_current_user)
):
    """Create invoice based on contract and appointments"""
    child_id = data['child_id']
    period_start = data['period_start']
    period_end = data['period_end']
    
    # Get active contract
    contract = await db.contracts.find_one({
        "child_id": child_id,
        "professional_id": professional_id,
        "active": True
    }, {"_id": 0})
    
    if not contract:
        raise HTTPException(status_code=400, detail="Aucun contrat actif trouvé")
    
    # Get appointments in period
    appointments = await db.appointments.find({
        "child_id": child_id,
        "professional_id": professional_id,
        "appointment_type": "seance",
        "start_datetime": {
            "$gte": datetime.fromisoformat(period_start),
            "$lte": datetime.fromisoformat(period_end + 'T23:59:59')
        }
    }, {"_id": 0}).to_list(100)
    
    session_count = len(appointments)
    
    # Calculate amount
    if contract['billing_mode'] == 'par_seance' and contract.get('session_price'):
        amount = contract['session_price'] * session_count
    elif contract['billing_mode'] == 'tarif_horaire' and contract.get('hourly_rate') and contract.get('session_duration_minutes'):
        hours = contract['session_duration_minutes'] / 60
        amount = contract['hourly_rate'] * hours * session_count
    else:
        amount = 0
    
    # Get child info
    child = await db.children.find_one({"id": child_id}, {"_id": 0})
    
    # Generate invoice number
    count = await db.invoices.count_documents({"professional_id": professional_id})
    invoice_number = f"FAC-{datetime.now(timezone.utc).year}-{str(count + 1).zfill(3)}"
    
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "child_id": child_id,
        "professional_id": professional_id,
        "parent_id": contract['parent_id'],
        "invoice_number": invoice_number,
        "issue_date": date.today().isoformat(),
        "sent_date": None,
        "amount_total": amount,
        "amount_paid": 0.0,
        "amount_remaining": amount,
        "status": "brouillon",
        "payment_date": None,
        "last_partial_payment_date": None,
        "payment_method": None,
        "pdf_document_id": None,
        "notes": f"Période: {period_start} au {period_end} - {session_count} séance(s)",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.invoices.insert_one(invoice_doc)
    invoice_doc.pop("_id", None)
    return invoice_doc

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
