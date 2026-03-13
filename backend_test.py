import requests
import sys
from datetime import datetime
import json

class QuotesModuleAPITester:
    def __init__(self, base_url="https://devis-module.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_quotes = []

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
        """Get children list for quote creation"""
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
                self.child_id = children[0]['id']
                print(f"   Using child ID: {self.child_id}")
                return True
        return False

    def test_create_quote_per_session(self):
        """Test creating a quote with per-session billing"""
        if not hasattr(self, 'child_id'):
            print("❌ No child ID available for quote creation")
            return False
            
        parent_id = f"parent-{self.child_id.split('-')[1]}"  # Derive parent ID from child ID
        
        success, response = self.run_test(
            "Create Quote (Per Session)",
            "POST",
            "quotes",
            200,
            params={
                "child_id": self.child_id,
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
        if not hasattr(self, 'child_id'):
            print("❌ No child ID available for quote creation")
            return False
            
        parent_id = f"parent-{self.child_id.split('-')[1]}"
        
        success, response = self.run_test(
            "Create Quote (Hourly)",
            "POST",
            "quotes",
            200,
            params={
                "child_id": self.child_id,
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
    tester = QuotesModuleAPITester()
    
    print("=" * 60)
    print("🧪 TESTING DEVIS (QUOTES) MODULE APIs")
    print("=" * 60)
    
    # Authentication
    if not tester.test_login():
        print("\n❌ Login failed, stopping tests")
        return 1
    
    # Get children for quote creation
    if not tester.test_get_children_list():
        print("\n❌ Could not get children list, stopping tests")
        return 1
    
    # Core quote operations
    tests = [
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
    
    failed_tests = []
    for test in tests:
        try:
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
    print(f"Created quotes: {len(tester.created_quotes)}")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
    
    if tester.created_quotes:
        print(f"\n📝 Created quote IDs for cleanup: {tester.created_quotes}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())