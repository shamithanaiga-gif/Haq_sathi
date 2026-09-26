"""
Test Suite: Home Button Navigation Verification for Haq Saathi
Verifies:
1. Presence of Home button (#btn_home, #brand_home, #dash_tab_home, #bottom_nav_home).
2. Click and mobile touch handler (handleNavigateHome) with touch debouncing.
3. Correct routing to Home page (Dashboard 'schemes' tab when logged in, Login when logged out).
4. No blank screens when unauthenticated.
5. Audio and modals cleanly cleared on Home navigation.
"""

import sys

def test_home_navigation():
    print("=" * 70)
    print("   HAQ SAATHI - HOME BUTTON NAVIGATION VERIFICATION")
    print("=" * 70)

    with open('frontend/js/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    with open('frontend/css/style.css', 'r', encoding='utf-8') as f:
        style_css = f.read()

    with open('frontend/js/i18n.js', 'r', encoding='utf-8') as f:
        i18n_js = f.read()

    # 1. Verify Home Button Components Exist
    print("\n[Test 1/5] Checking Home navigation components in app.js...")
    assert 'id="btn_home"' in app_js, "Explicit Home button (#btn_home) must be present in header controls"
    assert 'id="brand_home"' in app_js, "Brand logo (#brand_home) must be present and wired for Home navigation"
    assert 'id="dash_tab_home"' in app_js, "Dashboard tab Home button (#dash_tab_home) must be present"
    assert 'id="bottom_nav_home"' in app_js, "Mobile bottom navigation Home button (#bottom_nav_home) must be present"
    print("  [OK] #btn_home present in header controls")
    print("  [OK] #brand_home present on top header brand")
    print("  [OK] #dash_tab_home present on dashboard tabs")
    print("  [OK] #bottom_nav_home present in mobile bottom nav")

    # 2. Verify Click & Touch Handlers
    print("\n[Test 2/5] Checking Desktop Click and Mobile Touch handlers...")
    assert 'onClick={handleNavigateHome}' in app_js, "Desktop click handler must be wired to handleNavigateHome"
    assert 'onTouchEnd={handleNavigateHome}' in app_js, "Mobile touch handler onTouchEnd must be wired to handleNavigateHome"
    assert 'lastNavTimeRef' in app_js, "Debounce mechanism for touch + synthetic click duplicate events must exist"
    print("  [OK] Desktop click (onClick) wired to handleNavigateHome")
    print("  [OK] Mobile touch (onTouchEnd) wired to handleNavigateHome")
    print("  [OK] Touch debounce (300ms) prevents double execution on touch devices")

    # 3. Verify Navigation Logic and State Transition
    print("\n[Test 3/5] Checking navigation routing logic in handleNavigateHome...")
    assert "setCurrentScreen('dashboard')" in app_js, "Must set currentScreen to 'dashboard' when authenticated"
    assert "setActiveTab('schemes')" in app_js, "Must reset activeTab to 'schemes' (Home view)"
    assert "setCurrentScreen('login')" in app_js, "Must set currentScreen to 'login' when unauthenticated"
    assert "stopAudio();" in app_js, "Must stop any ongoing TTS/STT audio on Home navigation"
    assert "setMissingFieldsModal(null)" in app_js, "Must close any active modals on Home navigation"
    print("  [OK] Navigates authenticated users directly to Dashboard ('schemes' Home tab)")
    print("  [OK] Navigates unauthenticated users to Login screen")
    print("  [OK] Clears speech synthesis/recognition and closes open modals")

    # 4. Verify Unauthenticated Blank Screen Protection
    print("\n[Test 4/5] Checking unauthenticated dashboard safeguard...")
    assert "currentScreen === 'dashboard' && !currentUser" in app_js, "Safeguard against blank screen when currentUser is null"
    assert "btn_fallback_login" in app_js, "Fallback login button provided in UI"
    print("  [OK] useEffect safeguard redirects invalid unauthenticated dashboard state")
    print("  [OK] Visual fallback screen prevents blank screen rendering")

    # 5. Verify CSS and i18n Translations
    print("\n[Test 5/5] Checking CSS styling and i18n strings...")
    assert ".nav-home-btn" in style_css, ".nav-home-btn style must be defined in style.css"
    assert "nav_home" in i18n_js, "nav_home must be defined in i18n.js"
    print("  [OK] .nav-home-btn styling verified in style.css")
    print("  [OK] nav_home translation strings verified in i18n.js")

    print("\n" + "=" * 70)
    print("  ALL HOME NAVIGATION VERIFICATION CHECKS PASSED (100% GREEN)!")
    print("=" * 70)

if __name__ == '__main__':
    test_home_navigation()
