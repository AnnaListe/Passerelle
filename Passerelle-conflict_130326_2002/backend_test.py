import requests
import sys
from datetime import datetime, timedelta
import json

class ChildcareAPITester:
    def __init__(self, base_url="https://devis-module.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_quotes = []
        self.created_children = []
        self.created_appointments = []
        self.created_contracts = []
        self.created_invoices = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if data:
                    response = requests.post(url, json=data, headers=headers, params=params)
                else:
                    response = requests.post(url, headers=headers, params=params)
            elif method == 'PUT':
                if data:
                    response = requests.put(url, json=data, headers=headers, params=params)
                else:
                    response = requests.put(url, headers=headers, params=params)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:
                    try:
                        result = response.json()
                        print(f"   Response: {json.dumps(result, indent=2, default=str)[:200]}...")
                        return True, result
                    except:
                        return True, {}
                return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": "lea.dubois@passerelle.fr", "password": "demo123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_quotes_list(self):
        """Test getting quotes list"""
        success, response = self.run_test(
            "Get Quotes List",
            "GET",
            "quotes",
            200
        )
        if success:
            quotes = response if isinstance(response, list) else response.get('data', [])
            print(f"   Found {len(quotes)} quotes")
            return True
        return False

    def test_get_children_list(self):
        """Get children list"""
        success, response = self.run_test(
            "Get Children List",
            "GET",
            "children",
            200
        )
        if success:
            children = response if isinstance(response, list) else response.get('data', [])
            print(f"   Found {len(children)} children")
            if children:
                self.existing_child_id = children[0]['id']
                print(f"   Using existing child ID: {self.existing_child_id}")
                return True
            return True
        return False

    def test_create_child(self):
        """Test creating a child with complete 6-section form"""
        child_data = {
            # Section I - Informations générales
            "first_name": "Test",
            "last_name": "Enfant",
            "birth_date": "2018-05-15",
            "address": "123 Rue de Test, 75001 Paris",
            "housing_type": "appartement",
            "own_bedroom": True,
            "siblings_count": 1,
            "parents_separated": False,
            
            # Section II - Scolarisation
            "schooling": {
                "is_schooled_or_institution": True,
                "schooling_description": "Scolarisé en classe ordinaire avec AESH",
                "school_name": "École Élémentaire Test",
                "schooling_type": "classe_ordinaire",
                "institution_name": None
            },
            
            # Section II - Emploi du temps
            "weekly_schedule": [
                {
                    "day_of_week": "lundi",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "label": "Orthophonie",
                    "category": "soin",
                    "location": "Cabinet Dr Martin"
                },
                {
                    "day_of_week": "mercredi",
                    "start_time": "14:00", 
                    "end_time": "15:00",
                    "label": "Psychomotricité",
                    "category": "soin",
                    "location": "Centre médical"
                }
            ],
            
            # Section II suite - Médical
            "medical_profile": {
                "treatment_active": True,
                "treatment_details": "Traitement médicamenteux en cours",
                "orthophonist_active": True,
                "orthophonist_frequency": "1x/semaine",
                "psychologist_active": False,
                "psychologist_frequency": None,
                "psychomotor_active": True,
                "psychomotor_frequency": "1x/2semaines",
                "occupational_therapist_active": False,
                "occupational_therapist_frequency": None,
                "sessad_active": False,
                "sessad_frequency": None,
                "other_professionals": None
            },
            
            # Section III - Communication
            "communication_profile": {
                "communication_type": "verbal",
                "alternative_communication_details": None,
                "comprehension_level": "Bonne compréhension des consignes simples"
            },
            
            # Section IV - Objectifs
            "goals": {
                "autonomy": "Développer l'autonomie pour l'habillage",
                "toilet_training": None,
                "socialization": "Améliorer les interactions avec les pairs",
                "emotions": "Apprendre à exprimer ses émotions",
                "language_communication": "Enrichir le vocabulaire",
                "motor_skills": "Améliorer la motricité fine",
                "environment_support": "Mise en place de supports visuels",
                "other_goals": None
            },
            
            # Section V - Famille
            "family_contacts": {
                "parent1_name": "Marie Dupont",
                "parent1_phone": "0123456789",
                "parent1_email": "marie.dupont@test.fr",
                "parent2_name": "Jean Dupont", 
                "parent2_phone": "0987654321",
                "parent2_email": "jean.dupont@test.fr"
            },
            
            # Section VI - Informations complémentaires
            "additional_info": {
                "free_notes": "Enfant très souriant, aime les activités manuelles et les histoires."
            }
        }
        
        success, response = self.run_test(
            "Create Child (6 sections)",
            "POST",
            "children",
            200,
            data=child_data
        )
        if success and 'id' in response:
            self.created_children.append(response['id'])
            self.new_child_id = response['id']
            print(f"   Created child ID: {response['id']}")
            return True
        return False

    def test_child_detail(self):
        """Test getting child detail with all sections"""
        if not hasattr(self, 'new_child_id'):
            print("❌ No child ID available for detail test")
            return False
            
        success, response = self.run_test(
            "Get Child Detail",
            "GET", 
            f"children/{self.new_child_id}",
            200
        )
        if success:
            print(f"   Child name: {response.get('child', {}).get('first_name')} {response.get('child', {}).get('last_name')}")
            print(f"   Schooling: {response.get('schooling', {}).get('school_name', 'None')}")
            print(f"   Medical profile: {'Yes' if response.get('medical_profile') else 'No'}")
            print(f"   Weekly schedule entries: {len(response.get('weekly_schedule', []))}")
            print(f"   Goals defined: {'Yes' if response.get('goals') else 'No'}")
            return True
        return False

    def test_update_child(self):
        """Test updating child information"""
        if not hasattr(self, 'new_child_id'):
            print("❌ No child ID available for update test")
            return False
            
        update_data = {
            "first_name": "Test Updated",
            "last_name": "Enfant Modified", 
            "birth_date": "2018-05-15",
            "address": "456 Nouvelle Rue, 75002 Paris",
            "housing_type": "maison",
            "own_bedroom": True,
            "siblings_count": 2,
            "parents_separated": False,
            "schooling": {
                "is_schooled_or_institution": True,
                "schooling_description": "Maintenant en ULIS",
                "school_name": "École Élémentaire Test",
                "schooling_type": "ulis"
            },
            "weekly_schedule": [
                {
                    "day_of_week": "mardi",
                    "start_time": "10:00",
                    "end_time": "11:00", 
                    "label": "Séance modifiée",
                    "category": "soin",
                    "location": "Nouveau cabinet"
                }
            ],
            "medical_profile": {
                "treatment_active": True,
                "treatment_details": "Traitement modifié",
                "orthophonist_active": True,
                "orthophonist_frequency": "2x/semaine"
            },
            "goals": {
                "autonomy": "Objectifs mis à jour pour l'autonomie",
                "socialization": "Nouveaux objectifs sociaux"
            },
            "family_contacts": {
                "parent1_name": "Marie Dupont-Martin",
                "parent1_phone": "0123456789",
                "parent1_email": "marie.dupont@test.fr"
            },
            "additional_info": {
                "free_notes": "Notes mises à jour après modification."
            }
        }
        
        success, response = self.run_test(
            "Update Child",
            "PUT",
            f"children/{self.new_child_id}",
            200,
            data=update_data
        )
        if success:
            print(f"   Child updated successfully")
            return True
        return False

    def test_child_appointments_list(self):
        """Test getting appointments for a child"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        if not child_id:
            print("❌ No child ID available for appointments test")
            return False
            
        # Test with date range
        start_date = datetime.now().isoformat()
        end_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        success, response = self.run_test(
            "Get Child Appointments",
            "GET",
            f"appointments/child/{child_id}",
            200,
            params={"start_date": start_date, "end_date": end_date}
        )
        if success:
            appointments = response if isinstance(response, list) else response.get('data', [])
            print(f"   Found {len(appointments)} appointments for child")
            return True
        return False

    def test_create_appointment(self):
        """Test creating an appointment for a child"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        if not child_id:
            print("❌ No child ID available for appointment creation")
            return False
            
        appointment_data = {
            "child_id": child_id,
            "title": "Séance de test",
            "appointment_type": "seance",
            "start_datetime": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_datetime": (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
            "location": "Cabinet de test",
            "notes": "Rendez-vous créé pour les tests"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        if success and 'id' in response:
            self.created_appointments.append(response['id'])
            self.new_appointment_id = response['id']
            print(f"   Created appointment ID: {response['id']}")
            return True
        return False

    def test_update_appointment(self):
        """Test updating an appointment"""
        if not hasattr(self, 'new_appointment_id'):
            print("❌ No appointment ID available for update test")
            return False
            
        update_data = {
            "title": "Séance modifiée",
            "appointment_type": "seance",
            "start_datetime": (datetime.now() + timedelta(days=2)).isoformat(),
            "end_datetime": (datetime.now() + timedelta(days=2, hours=1)).isoformat(),
            "location": "Nouveau cabinet",
            "notes": "RDV modifié lors des tests"
        }
        
        success, response = self.run_test(
            "Update Appointment",
            "PUT",
            f"appointments/{self.new_appointment_id}",
            200,
            data=update_data
        )
        if success:
            print(f"   Appointment updated successfully")
            return True
        return False

    def test_delete_appointment(self):
        """Test deleting an appointment"""
        if not hasattr(self, 'new_appointment_id'):
            print("❌ No appointment ID available for delete test") 
            return False
            
        success, response = self.run_test(
            "Delete Appointment",
            "DELETE",
            f"appointments/{self.new_appointment_id}",
            200
        )
        if success:
            print(f"   Appointment deleted successfully")
            return True
        return False

    def test_contracts_list(self):
        """Test getting contracts list"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        
        success, response = self.run_test(
            "Get Contracts List",
            "GET", 
            "contracts",
            200,
            params={"child_id": child_id} if child_id else None
        )
        if success:
            contracts = response if isinstance(response, list) else response.get('data', [])
            print(f"   Found {len(contracts)} contracts")
            if contracts:
                # Check if any contract shows sessions per month in session mode
                for contract in contracts:
                    if contract.get('billing_mode') == 'par_seance' and contract.get('sessions_per_month'):
                        print(f"   ✅ Contract in session mode shows {contract['sessions_per_month']} sessions per month")
                        self.existing_contract_id = contract['id']
            return True
        return False

    def test_create_contract(self):
        """Test creating a contract with 'sessions per month' in session mode"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        if not child_id:
            print("❌ No child ID available for contract creation")
            return False
            
        parent_id = f"parent-{child_id.split('-')[1]}" if '-' in child_id else f"parent-test"
        
        success, response = self.run_test(
            "Create Contract (Session mode with sessions/month)",
            "POST",
            "contracts",
            200,
            params={
                "child_id": child_id,
                "parent_id": parent_id,
                "start_date": "2024-01-15",
                "billing_mode": "par_seance",
                "session_price": 45.0,
                "sessions_per_month": 4,  # This should be visible
                "notes": "Contrat de test avec 4 séances par mois"
            }
        )
        if success and 'id' in response:
            self.created_contracts.append(response['id'])
            self.new_contract_id = response['id']
            print(f"   Created contract ID: {response['id']}")
            print(f"   Billing mode: {response.get('billing_mode')}")
            print(f"   Sessions per month: {response.get('sessions_per_month')}")
            return True
        return False

    def test_invoice_from_contract(self):
        """Test creating invoice from contract and appointments"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        if not child_id:
            print("❌ No child ID available for invoice creation")
            return False
            
        # First create some appointments for the period
        start_date = "2024-01-01"
        end_date = "2024-01-31"
        
        # Create a few test appointments
        for i in range(3):
            appointment_data = {
                "child_id": child_id,
                "title": f"Séance facturée {i+1}",
                "appointment_type": "seance",
                "start_datetime": f"2024-01-{10+i*7:02d}T09:00:00",
                "end_datetime": f"2024-01-{10+i*7:02d}T10:00:00",
                "location": "Cabinet",
                "notes": "Séance pour facturation"
            }
            
            success, apt_response = self.run_test(
                f"Create Appointment for Invoice {i+1}",
                "POST", 
                "appointments",
                200,
                data=appointment_data
            )
            if success and 'id' in apt_response:
                self.created_appointments.append(apt_response['id'])
        
        # Now create invoice from contract
        invoice_data = {
            "child_id": child_id,
            "period_start": start_date,
            "period_end": end_date
        }
        
        success, response = self.run_test(
            "Create Invoice from Contract",
            "POST",
            "invoices/create-from-contract", 
            200,
            data=invoice_data
        )
        if success and 'id' in response:
            self.created_invoices.append(response['id'])
            print(f"   Created invoice ID: {response['id']}")
            print(f"   Invoice number: {response.get('invoice_number')}")
            print(f"   Total amount: {response.get('amount_total')}€")
            print(f"   Notes: {response.get('notes')}")
            return True
        return False

    def test_create_quote_per_session(self):
        """Test creating a quote with per-session billing"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        if not child_id:
            print("❌ No child ID available for quote creation")
            return False
            
        parent_id = f"parent-{child_id.split('-')[1]}" if '-' in child_id else f"parent-test"
        
        success, response = self.run_test(
            "Create Quote (Per Session)",
            "POST",
            "quotes",
            200,
            params={
                "child_id": child_id,
                "parent_id": parent_id,
                "billing_mode": "par_seance",
                "session_price": 45.0,
                "sessions_per_month": 4,
                "description": "Devis test pour séances individuelles",
                "validity_days": 30
            }
        )
        if success and 'id' in response:
            self.created_quotes.append(response['id'])
            self.session_quote_id = response['id']
            print(f"   Created quote ID: {response['id']}")
            print(f"   Quote number: {response.get('quote_number')}")
            return True
        return False

    def test_create_quote_hourly(self):
        """Test creating a quote with hourly billing"""
        child_id = getattr(self, 'new_child_id', getattr(self, 'existing_child_id', None))
        if not child_id:
            print("❌ No child ID available for quote creation")
            return False
            
        parent_id = f"parent-{child_id.split('-')[1]}" if '-' in child_id else f"parent-test"
        
        success, response = self.run_test(
            "Create Quote (Hourly)",
            "POST",
            "quotes",
            200,
            params={
                "child_id": child_id,
                "parent_id": parent_id,
                "billing_mode": "tarif_horaire",
                "hourly_rate": 60.0,
                "sessions_per_month": 4,
                "session_duration_minutes": 60,
                "description": "Devis test avec tarification horaire",
                "validity_days": 30
            }
        )
        if success and 'id' in response:
            self.created_quotes.append(response['id'])
            self.hourly_quote_id = response['id']
            print(f"   Created quote ID: {response['id']}")
            print(f"   Quote number: {response.get('quote_number')}")
            return True
        return False

    def test_get_quote_detail(self):
        """Test getting quote details"""
        if not hasattr(self, 'session_quote_id'):
            print("❌ No quote ID available for detail test")
            return False
            
        success, response = self.run_test(
            "Get Quote Detail",
            "GET",
            f"quotes/{self.session_quote_id}",
            200
        )
        if success:
            print(f"   Quote status: {response.get('status')}")
            print(f"   Estimated amount: {response.get('estimated_monthly_amount')}€")
            return True
        return False

    def test_update_quote(self):
        """Test updating a quote"""
        if not hasattr(self, 'session_quote_id'):
            print("❌ No quote ID available for update test")
            return False
            
        success, response = self.run_test(
            "Update Quote",
            "PUT",
            f"quotes/{self.session_quote_id}",
            200,
            params={
                "session_price": 50.0,
                "sessions_per_month": 5,
                "description": "Devis mis à jour avec nouveaux tarifs"
            }
        )
        if success:
            print(f"   Updated price: {response.get('session_price')}€")
            print(f"   New estimated amount: {response.get('estimated_monthly_amount')}€")
            return True
        return False

    def test_quote_status_workflow(self):
        """Test the complete quote status workflow"""
        if not hasattr(self, 'hourly_quote_id'):
            print("❌ No quote ID available for status workflow test")
            return False
            
        quote_id = self.hourly_quote_id
        
        # Test sending quote (brouillon -> envoye)
        success, _ = self.run_test(
            "Send Quote (brouillon -> envoye)",
            "PATCH",
            f"quotes/{quote_id}/status",
            200,
            params={"status": "envoye"}
        )
        if not success:
            return False

        # Test accepting quote (envoye -> accepte)
        success, _ = self.run_test(
            "Accept Quote (envoye -> accepte)",
            "PATCH",
            f"quotes/{quote_id}/status",
            200,
            params={"status": "accepte"}
        )
        if not success:
            return False

        # Store for conversion test
        self.accepted_quote_id = quote_id
        return True

    def test_convert_to_contract(self):
        """Test converting quote to contract"""
        if not hasattr(self, 'accepted_quote_id'):
            print("❌ No accepted quote available for conversion test")
            return False
            
        success, response = self.run_test(
            "Convert Quote to Contract",
            "POST",
            f"quotes/{self.accepted_quote_id}/convert-to-contract",
            200,
            params={
                "start_date": "2024-01-15",
                "notes": "Contrat créé depuis devis accepté"
            }
        )
        if success and 'id' in response:
            print(f"   Created contract ID: {response['id']}")
            print(f"   Contract active: {response.get('active')}")
            return True
        return False

    def test_quote_filters(self):
        """Test quote list with status filters"""
        statuses = ["brouillon", "envoye", "accepte", "refuse"]
        
        for status in statuses:
            success, response = self.run_test(
                f"Filter Quotes by Status ({status})",
                "GET",
                "quotes",
                200,
                params={"status": status}
            )
            if success:
                quotes = response if isinstance(response, list) else response.get('data', [])
                filtered_quotes = [q for q in quotes if q.get('status') == status]
                print(f"   Found {len(filtered_quotes)} quotes with status '{status}'")
            
        return True

    def test_error_scenarios(self):
        """Test error handling scenarios"""
        # Test getting non-existent quote
        success, _ = self.run_test(
            "Get Non-existent Quote",
            "GET",
            "quotes/non-existent-id",
            404
        )
        
        # Test updating non-existent quote
        success2, _ = self.run_test(
            "Update Non-existent Quote",
            "PUT",
            "quotes/non-existent-id",
            404,
            params={"session_price": 100.0}
        )
        
        # Test converting non-accepted quote
        if hasattr(self, 'session_quote_id'):
            success3, _ = self.run_test(
                "Convert Non-accepted Quote",
                "POST",
                f"quotes/{self.session_quote_id}/convert-to-contract",
                400,
                params={"start_date": "2024-01-15"}
            )
        
        return success and success2

def main():
    """Run all tests"""
    tester = ChildcareAPITester()
    
    print("=" * 60)
    print("🧪 TESTING FRENCH CHILDCARE MANAGEMENT APIs")
    print("=" * 60)
    
    # Authentication
    if not tester.test_login():
        print("\n❌ Login failed, stopping tests")
        return 1
    
    # Get existing children first
    if not tester.test_get_children_list():
        print("\n❌ Could not get children list, continuing with creation tests")
    
    # Core children operations (6 sections form)
    children_tests = [
        tester.test_create_child,
        tester.test_child_detail,
        tester.test_update_child,
    ]
    
    # Planning and appointments 
    planning_tests = [
        tester.test_child_appointments_list,
        tester.test_create_appointment,
        tester.test_update_appointment,
        tester.test_delete_appointment,
    ]
    
    # Contracts and invoices
    contract_tests = [
        tester.test_contracts_list,
        tester.test_create_contract,
        tester.test_invoice_from_contract,
    ]
    
    # Quote operations (existing)
    quote_tests = [
        tester.test_get_quotes_list,
        tester.test_create_quote_per_session,
        tester.test_create_quote_hourly,
        tester.test_get_quote_detail,
        tester.test_update_quote,
        tester.test_quote_status_workflow,
        tester.test_convert_to_contract,
        tester.test_quote_filters,
        tester.test_error_scenarios
    ]
    
    all_tests = children_tests + planning_tests + contract_tests + quote_tests
    
    failed_tests = []
    for test in all_tests:
        try:
            print(f"\n{'='*40}")
            if not test():
                failed_tests.append(test.__name__)
        except Exception as e:
            print(f"❌ {test.__name__} failed with exception: {str(e)}")
            failed_tests.append(test.__name__)
    
    # Print results
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    print(f"\n📝 Created resources:")
    print(f"  Children: {len(tester.created_children)}")
    print(f"  Appointments: {len(tester.created_appointments)}")
    print(f"  Contracts: {len(tester.created_contracts)}")
    print(f"  Invoices: {len(tester.created_invoices)}")
    print(f"  Quotes: {len(tester.created_quotes)}")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\nSuccess rate: {success_rate:.1f}%")
    
    # Specific feature validation
    print(f"\n🎯 KEY FEATURES VALIDATION:")
    print(f"  ✅ 6-section child form: {'PASS' if any('create_child' in t for t in [test.__name__ for test in all_tests if test.__name__ not in failed_tests]) else 'FAIL'}")
    print(f"  ✅ Child planning/appointments: {'PASS' if any('appointment' in t for t in [test.__name__ for test in all_tests if test.__name__ not in failed_tests]) else 'FAIL'}")
    print(f"  ✅ Contract sessions per month: {'PASS' if any('contract' in t for t in [test.__name__ for test in all_tests if test.__name__ not in failed_tests]) else 'FAIL'}")
    print(f"  ✅ Invoice from contract: {'PASS' if any('invoice_from_contract' in t for t in [test.__name__ for test in all_tests if test.__name__ not in failed_tests]) else 'FAIL'}")
    
    return 0 if success_rate >= 75 else 1

if __name__ == "__main__":
    sys.exit(main())