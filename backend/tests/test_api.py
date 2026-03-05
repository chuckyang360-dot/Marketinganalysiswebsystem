"""
Simple API test script for Vibe Marketing Backend
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"


def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get("http://localhost:8000/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()


def test_google_auth_url():
    """Test Google OAuth URL endpoint"""
    print("Testing Google OAuth URL endpoint...")
    response = requests.get(f"{BASE_URL}/auth/google/auth-url")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()


def test_analyze_endpoint(token):
    """Test analyze endpoint (requires authentication)"""
    print("Testing analyze endpoint...")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "keyword": "marketing",
        "analysis_type": "both"
    }

    response = requests.post(
        f"{BASE_URL}/x-agent/analyze",
        headers=headers,
        json=payload
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    print()


def test_trending_endpoint(token):
    """Test trending topics endpoint (requires authentication)"""
    print("Testing trending topics endpoint...")
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(
        f"{BASE_URL}/x-agent/trending",
        headers=headers
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error: {response.text}")
    print()


def main():
    print("=" * 50)
    print("Vibe Marketing Backend API Tests")
    print("=" * 50)
    print()

    # Test public endpoints
    test_health()
    test_google_auth_url()

    # Test protected endpoints (requires valid token)
    print("Note: The following tests require a valid JWT token.")
    print("You can obtain a token by logging in through the frontend.")
    print()

    token = input("Enter your JWT token (or press Enter to skip): ").strip()

    if token:
        test_analyze_endpoint(token)
        test_trending_endpoint(token)
    else:
        print("Skipping protected endpoint tests.")

    print()
    print("=" * 50)
    print("Tests completed!")
    print("=" * 50)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the backend is running.")
    except Exception as e:
        print(f"Error: {e}")
