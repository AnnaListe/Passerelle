from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Enums
class UserRole(str, Enum):
    PROFESSIONAL = "professional"
    PARENT = "parent"

class MessageSenderType(str, Enum):
    PROFESSIONAL = "professional"
    PARENT = "parent"

class InvoiceStatus(str, Enum):
    DRAFT = "brouillon"
    PENDING = "en_attente_paiement"
    PARTIALLY_PAID = "partiellement_payee"
    PAID = "payee"
    OVERDUE = "impayee"

class DocumentCategory(str, Enum):
    BILAN = "bilan"
    COMPTE_RENDU = "compte_rendu"
    ORDONNANCE = "ordonnance"
    DOCUMENT_ADMIN = "document_administratif"
    JUSTIFICATIF = "justificatif"
    DOCUMENT_SEANCE = "document_seance"
    AUTRE = "autre"

class AppointmentStatus(str, Enum):
    SCHEDULED = "planifie"
    COMPLETED = "termine"
    CANCELLED = "annule"

class CommunicationType(str, Enum):
    VERBAL = "verbal"
    NON_VERBAL = "non_verbal"
    ALTERNATIF = "alternatif"

class DayOfWeek(str, Enum):
    LUNDI = "lundi"
    MARDI = "mardi"
    MERCREDI = "mercredi"
    JEUDI = "jeudi"
    VENDREDI = "vendredi"
    SAMEDI = "samedi"
    DIMANCHE = "dimanche"

class ScheduleCategory(str, Enum):
    ECOLE = "ecole"
    SOIN = "soin"
    ACTIVITE = "activite"
    AUTRE = "autre"

# Base Models
class Professional(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    first_name: str
    last_name: str
    profession: str
    specialty: Optional[str] = None
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    description: Optional[str] = None
    has_passerelle_account: bool = True
    created_at: datetime
    updated_at: datetime

class Parent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    relationship_to_child: Optional[str] = None
    avatar_url: Optional[str] = None

class Child(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    first_name: str
    last_name: str
    birth_date: date
    age: int
    photo_url: Optional[str] = None
    address: Optional[str] = None
    housing_type: Optional[str] = None
    own_bedroom: Optional[bool] = None
    siblings_count: Optional[int] = None
    parents_separated: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

class ChildSchooling(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    is_schooled_or_institution: bool
    schooling_description: Optional[str] = None
    school_name: Optional[str] = None
    schooling_type: Optional[str] = None

class ChildWeeklySchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    day_of_week: DayOfWeek
    start_time: str
    end_time: str
    label: str
    category: ScheduleCategory
    notes: Optional[str] = None
    related_professional_id: Optional[str] = None
    location: Optional[str] = None

class ChildMedicalProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    treatment_active: bool = False
    treatment_details: Optional[str] = None
    orthophonist_active: bool = False
    orthophonist_frequency: Optional[str] = None
    psychologist_active: bool = False
    psychologist_frequency: Optional[str] = None
    psychomotor_active: bool = False
    psychomotor_frequency: Optional[str] = None
    occupational_therapist_active: bool = False
    occupational_therapist_frequency: Optional[str] = None
    sessad_active: bool = False
    sessad_frequency: Optional[str] = None
    other_professionals: Optional[str] = None

class ChildCommunicationProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    communication_type: CommunicationType
    alternative_communication_details: Optional[str] = None
    comprehension_level: Optional[str] = None
    notes: Optional[str] = None

class ChildGoals(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    autonomy: Optional[str] = None
    toilet_training: Optional[str] = None
    socialization: Optional[str] = None
    emotions: Optional[str] = None
    language_communication: Optional[str] = None
    motor_skills: Optional[str] = None
    environment_support: Optional[str] = None
    other_goals: Optional[str] = None

class ChildAdditionalInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    interests: Optional[str] = None
    passions: Optional[str] = None
    favorite_character: Optional[str] = None
    food_notes: Optional[str] = None
    allergies: Optional[str] = None
    habits: Optional[str] = None
    special_situations: Optional[str] = None
    free_notes: Optional[str] = None

class FamilyContacts(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    parent1_name: Optional[str] = None
    parent1_phone: Optional[str] = None
    parent1_email: Optional[str] = None
    parent2_name: Optional[str] = None
    parent2_phone: Optional[str] = None
    parent2_email: Optional[str] = None

class ChildProfessionalLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    professional_id: str
    role_label: str
    active: bool = True

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    professional_id: str
    title: str
    appointment_type: str
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    notes: Optional[str] = None
    status: AppointmentStatus = AppointmentStatus.SCHEDULED

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    parent_id: str
    professional_id: str
    last_message_at: datetime
    created_at: datetime

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    conversation_id: str
    sender_type: MessageSenderType
    sender_id: str
    content: str
    has_attachment: bool = False
    created_at: datetime
    read_at: Optional[datetime] = None

class ProfessionalConversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    professional_1_id: str
    professional_2_id: str
    last_message_at: datetime
    created_at: datetime

class ProfessionalMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    professional_conversation_id: str
    sender_professional_id: str
    content: str
    has_attachment: bool = False
    created_at: datetime
    read_at: Optional[datetime] = None

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    uploaded_by_type: str
    uploaded_by_id: str
    related_professional_id: Optional[str] = None
    related_conversation_id: Optional[str] = None
    related_professional_conversation_id: Optional[str] = None
    related_invoice_id: Optional[str] = None
    category: DocumentCategory
    title: str
    file_name: str
    file_url: str
    mime_type: Optional[str] = None
    size: Optional[int] = None
    uploaded_at: datetime

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    professional_id: str
    parent_id: str
    invoice_number: str
    issue_date: date
    sent_date: Optional[date] = None
    amount_total: float
    amount_paid: float = 0.0
    amount_remaining: float
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_date: Optional[date] = None
    last_partial_payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    pdf_document_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

# Input models for creation
class LoginInput(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    professional: Professional

class ChildDetailResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    child: Child
    schooling: Optional[ChildSchooling] = None
    weekly_schedule: List[ChildWeeklySchedule] = []
    medical_profile: Optional[ChildMedicalProfile] = None
    communication_profile: Optional[ChildCommunicationProfile] = None
    goals: Optional[ChildGoals] = None
    additional_info: Optional[ChildAdditionalInfo] = None
    family_contacts: Optional[FamilyContacts] = None
    professionals: List[Professional] = []
    parent: Optional[Parent] = None

class ConversationWithDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conversation: Conversation
    parent: Parent
    child: Child
    last_message: Optional[Message] = None
    unread_count: int = 0

class ProfessionalConversationWithDetails(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conversation: ProfessionalConversation
    other_professional: Professional
    child: Child
    last_message: Optional[ProfessionalMessage] = None
    unread_count: int = 0

class BillingMode(str, Enum):
    PER_SESSION = "par_seance"
    HOURLY_RATE = "tarif_horaire"

class QuoteStatus(str, Enum):
    DRAFT = "brouillon"
    SENT = "envoye"
    ACCEPTED = "accepte"
    REFUSED = "refuse"

class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    professional_id: str
    parent_id: str
    quote_number: str
    issue_date: date
    validity_date: Optional[date] = None
    billing_mode: BillingMode
    # For per session billing
    session_price: Optional[float] = None
    # For hourly rate billing
    hourly_rate: Optional[float] = None
    sessions_per_week: Optional[int] = None
    sessions_per_month: Optional[int] = None
    session_duration_minutes: Optional[int] = None
    estimated_monthly_amount: float
    description: Optional[str] = None
    status: QuoteStatus = QuoteStatus.DRAFT
    converted_to_contract_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    child_id: str
    professional_id: str
    parent_id: str
    quote_id: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    billing_mode: BillingMode
    # For per session billing
    session_price: Optional[float] = None
    # For hourly rate billing
    hourly_rate: Optional[float] = None
    sessions_per_week: Optional[int] = None
    sessions_per_month: Optional[int] = None
    session_duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    active: bool = True
    created_at: datetime
    updated_at: datetime

class DashboardStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    upcoming_appointments: List[Appointment] = []
    recent_children: List[Child] = []
    recent_messages: List[ConversationWithDetails] = []
    recent_documents: List[Document] = []
    recent_invoices: List[Invoice] = []
    pending_invoices_count: int = 0
    overdue_invoices_count: int = 0
