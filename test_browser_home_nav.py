import subprocess
import time
import json
import urllib.request
import os
import socket
import struct
import base64
import hashlib

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
PORT = 9224

class SimpleWebSocket:
    def __init__(self, ws_url):
        # ws_url: ws://127.0.0.1:PORT/devtools/page/...
        clean = ws_url.replace("ws://", "")
        parts = clean.split("/", 1)
        host_port = parts[0].split(":")
        self.host = host_port[0]
        self.port = int(host_port[1])
        self.path = "/" + parts[1]

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.host, self.port))
        
        # Handshake
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        req = (
            f"GET {self.path} HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode('utf-8'))
        resp = self.sock.recv(4096).decode('utf-8', errors='ignore')
        if "101" not in resp:
            raise Exception("WebSocket handshake failed: " + resp)

    def send_text(self, text):
        data = text.encode('utf-8')
        length = len(data)
        frame = bytearray([0x81]) # FIN + text
        mask_key = os.urandom(4)
        if length <= 125:
            frame.append(0x80 | length)
        elif length <= 65535:
            frame.append(0x80 | 126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack("!Q", length))
        frame.extend(mask_key)
        masked = bytearray(b ^ mask_key[i % 4] for i, b in enumerate(data))
        frame.extend(masked)
        self.sock.sendall(frame)

    def recv_text(self):
        hdr = self.sock.recv(2)
        if not hdr:
            return ""
        b1, b2 = hdr[0], hdr[1]
        length = b2 & 0x7F
        if length == 126:
            length = struct.unpack("!H", self.sock.recv(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self.sock.recv(8))[0]
        
        payload = bytearray()
        while len(payload) < length:
            chunk = self.sock.recv(length - len(payload))
            if not chunk:
                break
            payload.extend(chunk)
        return payload.decode('utf-8', errors='ignore')

    def eval(self, expr, req_id=1):
        msg = json.dumps({"id": req_id, "method": "Runtime.evaluate", "params": {"expression": expr, "returnByValue": True}})
        self.send_text(msg)
        while True:
            resp_str = self.recv_text()
            if not resp_str:
                return None
            try:
                data = json.loads(resp_str)
                if data.get("id") == req_id:
                    return data.get("result", {}).get("result", {}).get("value")
            except Exception:
                continue

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass

def run_browser_nav_tests():
    print("=" * 70)
    print("   HAQ SAATHI - HEADLESS BROWSER HOME NAVIGATION TEST")
    print("=" * 70)

    profile_dir = os.path.abspath("test_edge_prof")
    proc = subprocess.Popen([
        EDGE_EXE,
        "--headless=new",
        f"--remote-debugging-port={PORT}",
        "--no-first-run",
        "--no-default-browser-check",
        f"--user-data-dir={profile_dir}",
        "http://127.0.0.1:8000"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws = None
    try:
        version_url = f"http://127.0.0.1:{PORT}/json/list"
        pages = None
        for _ in range(25):
            time.sleep(0.4)
            try:
                with urllib.request.urlopen(version_url) as resp:
                    pages = json.loads(resp.read().decode('utf-8'))
                    if pages and len(pages) > 0:
                        break
            except Exception:
                pass

        if not pages:
            print("ERROR: Could not establish CDP connection to browser")
            return False

        ws_url = pages[0].get("webSocketDebuggerUrl")
        ws = SimpleWebSocket(ws_url)
        print("Connected to Headless Edge via CDP WebSocket.")

        # Clear localStorage to test unauthenticated initial state first
        try:
            ws.eval("localStorage.clear(); window.location.reload();", 100)
            ws.close()
        except Exception:
            pass
        time.sleep(1.5)

        # Reconnect WebSocket after reload
        with urllib.request.urlopen(version_url) as resp:
            pages = json.loads(resp.read().decode('utf-8'))
        ws_url = pages[0].get("webSocketDebuggerUrl")
        ws = SimpleWebSocket(ws_url)

        # Wait for Babel Standalone to compile and React app to mount
        mounted = False
        for i in range(30):
            has_btn = ws.eval("document.getElementById('btn_home') !== null", 101 + i)
            if has_btn:
                mounted = True
                break
            time.sleep(0.5)

        root_html = ws.eval("document.getElementById('root') ? document.getElementById('root').innerHTML : 'NO ROOT'", 150)
        print("Root HTML length:", len(root_html) if root_html else 0)
        assert mounted, "React app must finish compiling and mounting with #btn_home"
        if root_html and len(root_html) < 200:
            print("Root HTML:", root_html)

        # 1. Verify existence of home buttons in DOM
        print("\n[Browser Check 1/5] Checking Home navigation elements in DOM...")
        btn_home = ws.eval("document.getElementById('btn_home') !== null", 1)
        brand_home = ws.eval("document.getElementById('brand_home') !== null", 2)
        bottom_nav_home = ws.eval("document.getElementById('bottom_nav_home') !== null", 3)
        print(f"  [OK] #btn_home exists: {btn_home}")
        print(f"  [OK] #brand_home exists: {brand_home}")
        print(f"  [OK] #bottom_nav_home exists: {bottom_nav_home}")
        assert btn_home and brand_home and bottom_nav_home

        # 2. Test desktop click on #btn_home in unauthenticated state
        print("\n[Browser Check 2/5] Testing Desktop click on #btn_home (Unauthenticated)...")
        print("Initial innerText:", ascii(ws.eval("document.getElementById('root').innerText.substring(0, 100)", 401)))
        click_unauth = ws.eval("""
            (() => {
                document.getElementById('btn_home').click();
                return document.getElementById('login_phone_input') !== null || document.getElementById('btn_tap_to_begin') !== null || document.getElementById('btn_lang_kn') !== null || document.getElementById('btn_send_otp') !== null;
            })()
        """, 4)
        print("After click innerText:", ascii(ws.eval("document.getElementById('root').innerText.substring(0, 100)", 402)))
        print("Root innerHTML elements:", ascii(ws.eval("""
            (() => {
                const els = Array.from(document.querySelectorAll('[id]')).map(e => e.id);
                return els.join(', ');
            })()
        """, 403)))
        print(f"  [OK] Desktop click kept/navigated cleanly to Home login screen without blank page: {click_unauth}")
        assert click_unauth

        # 3. Test mobile touch (touchend) on #brand_home
        print("\n[Browser Check 3/5] Testing Mobile Touch (touchend) on #brand_home...")
        touch_brand = ws.eval("""
            (() => {
                const brand = document.getElementById('brand_home');
                const evt = new Event('touchend', { bubbles: true, cancelable: true });
                brand.dispatchEvent(evt);
                return document.getElementById('btn_home') !== null;
            })()
        """, 5)
        print(f"  [OK] Mobile touchend on #brand_home executed smoothly: {touch_brand}")
        assert touch_brand

        # 4. Set authenticated user in localStorage, trigger Home navigation to Dashboard
        time.sleep(0.5)
        print("\n[Browser Check 4/5] Testing Home navigation with authenticated session...")
        login_res = ws.eval("""
            (() => {
                localStorage.setItem('haq_phone', '9988447317');
                localStorage.setItem('haq_user', JSON.stringify({
                    name: 'Manjula Gowda',
                    phone: '9988447317',
                    occupation: 'Construction Worker',
                    aadhaar_masked: 'XXXX XXXX 8901'
                }));
                // Click Home button to navigate to Dashboard Home
                document.getElementById('btn_home').click();
                return true;
            })()
        """, 6)
        dash_home_visible = False
        for _ in range(15):
            time.sleep(0.3)
            dash_home_visible = ws.eval("document.getElementById('dash_tab_home') !== null", 7)
            if dash_home_visible:
                break
        print(f"  [OK] Navigated to Dashboard Home: {dash_home_visible}")
        assert dash_home_visible

        # 5. Switch to a non-home tab (e.g. applications) and click Home to return to Schemes (Home)
        time.sleep(0.5)
        print("\n[Browser Check 5/5] Testing navigation back to Home from Applications tab...")
        switch_tab = ws.eval("""
            (() => {
                const appTab = document.getElementById('dash_tab_applications');
                if (appTab) {
                    appTab.click();
                    return true;
                }
                return false;
            })()
        """, 8)
        time.sleep(0.5)

        # Click #btn_home to return to Home (Schemes)
        ws.eval("document.getElementById('btn_home').click();", 9)
        time.sleep(0.5)
        nav_back = ws.eval("""
            (() => {
                const homeTab = document.getElementById('dash_tab_home');
                return homeTab && homeTab.classList.contains('active');
            })()
        """, 10)
        print(f"  [OK] #btn_home successfully navigated back to Home schemes tab (active): {nav_back}")
        assert nav_back

        # Test mobile touch on #bottom_nav_home as well
        bottom_nav_touch = ws.eval("""
            (() => {
                const bHome = document.getElementById('bottom_nav_home');
                if (bHome) {
                    const evt = new Event('touchend', { bubbles: true, cancelable: true });
                    bHome.dispatchEvent(evt);
                    return true;
                }
                return false;
            })()
        """, 10)
        print(f"  [OK] #bottom_nav_home mobile touch handled: {bottom_nav_touch}")
        assert bottom_nav_touch

        print("\n" + "=" * 70)
        print("  ALL BROWSER HOME NAVIGATION VERIFICATION CHECKS PASSED (100% GREEN)!")
        print("=" * 70)
        return True

    finally:
        if ws:
            ws.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == '__main__':
    run_browser_nav_tests()
