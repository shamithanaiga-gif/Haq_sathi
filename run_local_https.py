"""
Haq Saathi - Local HTTPS & Secure Mobile Testing Utility
Enables zero-domain HTTPS tunneling and local LAN TLS termination
so developers can test Web Speech API (Microphone) on Android/iOS devices.

Usage:
    python run_local_https.py               # Auto-mode (Tries Cloudflare Quick Tunnel, falls back to LAN HTTPS)
    python run_local_https.py --mode tunnel  # Cloudflare Quick Tunnel (Public HTTPS, zero signup)
    python run_local_https.py --mode lan     # Local LAN HTTPS (Wi-Fi access on https://<LAN-IP>:8443)
    python run_local_https.py --mode ngrok   # ngrok Tunnel (https://*.ngrok-free.app)
"""

import sys
import os
import subprocess
import time
import socket
import urllib.request
import urllib.error
import re
import argparse
import platform
import shutil
import ssl
import http.server
import http.client
from urllib.parse import urlparse

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BIN_DIR = os.path.join(PROJECT_DIR, ".bin")
CERTS_DIR = os.path.join(PROJECT_DIR, ".certs")


def get_local_ip() -> str:
    """Detects local LAN IPv4 address (Wi-Fi / Ethernet)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually make a connection; extracts default routing interface IP
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def is_backend_running(port: int = 8000) -> bool:
    """Checks if the Haq Saathi FastAPI server is currently responding."""
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/api/schemes")
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False


def ensure_backend_running(port: int = 8000) -> subprocess.Popen:
    """Verifies backend is running or spawns it automatically."""
    if is_backend_running(port):
        print(f"✓ Backend server is already running on http://127.0.0.1:{port}")
        return None

    print(f"==> Backend not detected on port {port}. Starting Haq Saathi server...")
    proc = subprocess.Popen(
        [sys.executable, os.path.join(PROJECT_DIR, "run.py")],
        cwd=PROJECT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    # Wait up to 10 seconds for backend to start
    for _ in range(20):
        time.sleep(0.5)
        if is_backend_running(port):
            print(f"✓ Haq Saathi backend server started on http://127.0.0.1:{port}")
            return proc

    print("⚠️ Warning: Backend startup timed out. Tunnel will forward once backend is online.")
    return proc


def get_cloudflared_path() -> str:
    """Locates cloudflared in PATH or downloads standalone binary if missing."""
    which_bin = shutil.which("cloudflared")
    if which_bin:
        return which_bin

    os.makedirs(BIN_DIR, exist_ok=True)
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "windows":
        exe_name = "cloudflared.exe"
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    elif system == "darwin":
        exe_name = "cloudflared"
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64"
    else:
        exe_name = "cloudflared"
        if "arm" in machine or "aarch" in machine:
            url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
        else:
            url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"

    target_path = os.path.join(BIN_DIR, exe_name)
    if os.path.exists(target_path):
        return target_path

    print(f"==> Standalone cloudflared not found. Downloading official executable from GitHub...")
    print(f"    Source: {url}")
    try:
        urllib.request.urlretrieve(url, target_path)
        if system != "windows":
            os.chmod(target_path, 0o755)
        print(f"✓ Downloaded cloudflared to {target_path}")
        return target_path
    except Exception as e:
        print(f"⚠️ Failed to automatically download cloudflared: {e}")
        return None


def run_cloudflare_tunnel(port: int = 8000):
    """Runs a zero-configuration Cloudflare Quick Tunnel giving instant public HTTPS."""
    bin_path = get_cloudflared_path()
    if not bin_path:
        print("❌ Cloudflared binary could not be acquired. Falling back to local LAN HTTPS mode.")
        run_lan_https(port)
        return

    print("======================================================================")
    print("  🚀 Starting Cloudflare Quick Tunnel (Zero-Configuration HTTPS)")
    print("======================================================================")
    print("  Forwarding to: http://127.0.0.1:8000")
    print("  Generating secure public HTTPS endpoint for mobile testing...\n")

    cmd = [bin_path, "tunnel", "--url", f"http://127.0.0.1:{port}", "--no-autoupdate"]
    
    # Launch process and capture stderr to parse the assigned *.trycloudflare.com URL
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace"
    )

    tunnel_url = None
    url_pattern = re.compile(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com')

    # Read stderr in real-time
    start_time = time.time()
    while time.time() - start_time < 30:
        line = proc.stderr.readline()
        if not line:
            if proc.poll() is not None:
                break
            time.sleep(0.1)
            continue

        match = url_pattern.search(line)
        if match:
            tunnel_url = match.group(0)
            break

    if tunnel_url:
        print("======================================================================")
        print("  🎉 SECURE HTTPS TUNNEL IS LIVE!")
        print(f"  👉 Mobile & Browser URL: {tunnel_url}")
        print("======================================================================")
        print("  📱 Mobile Instructions (Android / iOS):")
        print("  1. Open the URL above in Chrome on Android or Safari on iOS.")
        print("  2. Microphone permission is granted automatically on first prompt.")
        print("  3. Service Worker will register cleanly with zero mixed-content warnings.")
        print("  4. Press Ctrl+C in this terminal to terminate the tunnel.")
        print("======================================================================\n")

        # Stream remaining logs or wait
        try:
            while proc.poll() is None:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down tunnel...")
            proc.terminate()
    else:
        print("⚠️ Could not detect trycloudflare.com URL within 30 seconds.")
        print("Check if port 8000 is open or try running in LAN mode: python run_local_https.py --mode lan")


def find_openssl() -> str:
    """Finds OpenSSL binary in PATH or common Git/OS install locations."""
    which_bin = shutil.which("openssl")
    if which_bin:
        return which_bin
    common_paths = [
        r"C:\Program Files\Git\usr\bin\openssl.exe",
        r"C:\Program Files (x86)\Git\usr\bin\openssl.exe",
        r"C:\OpenSSL-Win64\bin\openssl.exe",
        r"C:\Program Files\OpenSSL\bin\openssl.exe",
        "/usr/bin/openssl",
        "/usr/local/bin/openssl",
        "/opt/homebrew/bin/openssl",
    ]
    for p in common_paths:
        if os.path.exists(p):
            return p
    return None


def generate_self_signed_cert(cert_file: str, key_file: str, lan_ip: str):
    """Generates a self-signed TLS certificate with SAN for localhost and LAN IP."""
    os.makedirs(os.path.dirname(cert_file), exist_ok=True)
    
    # Check if openssl is available
    openssl_bin = find_openssl()
    if openssl_bin:
        config_content = f"""
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = IN
ST = Karnataka
L = Bengaluru
O = Haq Saathi
CN = {lan_ip}

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = {lan_ip}
"""
        cnf_path = os.path.join(CERTS_DIR, "openssl.cnf")
        with open(cnf_path, "w", encoding="utf-8") as f:
            f.write(config_content)

        cmd = [
            openssl_bin, "req", "-x509", "-nodes", "-days", "365",
            "-newkey", "rsa:2048",
            "-keyout", key_file,
            "-out", cert_file,
            "-config", cnf_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return

    # Fallback to python cryptography library if openssl not found
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        import ipaddress

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, lan_ip)])
        alt_names = [
            x509.DNSName("localhost"),
            x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
            x509.IPAddress(ipaddress.IPv4Address(lan_ip))
        ]
        basic_constraints = x509.BasicConstraints(ca=True, path_length=0)
        now = datetime.datetime.now(datetime.timezone.utc)
        cert = (
            x509.CertificateBuilder()
            .subject_name(name)
            .issuer_name(name)
            .public_key(key.public_key())
            .serial_number(1000)
            .not_valid_before(now)
            .not_valid_after(now + datetime.timedelta(days=365))
            .add_extension(basic_constraints, False)
            .add_extension(x509.SubjectAlternativeName(alt_names), False)
            .sign(key, hashes.SHA256())
        )

        with open(key_file, "wb") as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        with open(cert_file, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
    except ImportError:
        raise RuntimeError("Neither 'openssl' nor the 'cryptography' Python package is available to generate TLS certificates.")


class SecureProxyHandler(http.server.BaseHTTPRequestHandler):
    """Transparent HTTPS reverse proxy adding audio security headers."""

    def do_GET(self):
        self._proxy_request("GET")

    def do_POST(self):
        self._proxy_request("POST")

    def do_PUT(self):
        self._proxy_request("PUT")

    def do_DELETE(self):
        self._proxy_request("DELETE")

    def do_OPTIONS(self):
        self._proxy_request("OPTIONS")

    def _proxy_request(self, method: str):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        conn = http.client.HTTPConnection("127.0.0.1", 8000, timeout=300)
        headers = {k: v for k, v in self.headers.items() if k.lower() != "host"}
        headers["Host"] = "127.0.0.1:8000"
        headers["X-Forwarded-For"] = self.client_address[0]
        headers["X-Forwarded-Proto"] = "https"

        try:
            conn.request(method, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            resp_body = resp.read()

            self.send_response(resp.status)
            for k, v in resp.getheaders():
                # Strip transfer encoding to prevent chunking mismatch
                if k.lower() != "transfer-encoding":
                    self.send_header(k, v)

            # Enforce PWA and Audio Permissions Security Headers
            self.send_header("Permissions-Policy", "microphone=(self)")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
            self.send_header("Content-Length", str(len(resp_body)))
            self.end_headers()

            self.wfile.write(resp_body)
        except Exception as e:
            self.send_error(502, f"Proxy Error: {e}")
        finally:
            conn.close()

    def log_message(self, format, *args):
        # Suppress verbose asset logging
        pass


def run_lan_https(https_port: int = 8443):
    """Runs native Uvicorn HTTPS server with local self-signed / mkcert TLS."""
    lan_ip = get_local_ip()
    cert_file = os.path.join(CERTS_DIR, "lan_cert.pem")
    key_file = os.path.join(CERTS_DIR, "lan_key.pem")

    if not (os.path.exists(cert_file) and os.path.exists(key_file)):
        print(f"==> Generating self-signed TLS certificate for LAN IP {lan_ip}...")
        try:
            generate_self_signed_cert(cert_file, key_file, lan_ip)
            print("✓ TLS certificate generated successfully.")
        except Exception as e:
            print(f"❌ Could not generate certificate: {e}")
            return

    print("======================================================================")
    print("  🏛️  Haq Saathi - Local LAN HTTPS Server Running")
    print("======================================================================")
    print(f"  👉 Desktop Browser:  https://localhost:{https_port}")
    print(f"  👉 Mobile Device:     https://{lan_ip}:{https_port}")
    print("======================================================================")
    print("  📱 Mobile Instructions:")
    print("  1. Connect your smartphone to the SAME Wi-Fi network as this PC.")
    print(f"  2. Open https://{lan_ip}:{https_port} on your mobile browser.")
    print("  3. Bypass the self-signed warning (Tap 'Advanced' -> 'Proceed').")
    print("  4. Microphone access and Service Worker are now fully enabled!")
    print("======================================================================\n", flush=True)

    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=https_port,
        ssl_keyfile=key_file,
        ssl_certfile=cert_file,
        reload=False
    )


def run_ngrok(port: int = 8000):
    """Runs ngrok tunnel if ngrok is installed."""
    ngrok_bin = shutil.which("ngrok")
    if not ngrok_bin:
        print("❌ 'ngrok' command not found. Please install ngrok or run with '--mode tunnel'.")
        return
    print(f"==> Launching ngrok forwarding to port {port}...")
    subprocess.run([ngrok_bin, "http", str(port)])


def main():
    parser = argparse.ArgumentParser(description="Haq Saathi HTTPS & Mobile Ingress Helper")
    parser.add_argument(
        "--mode",
        choices=["tunnel", "lan", "ngrok", "auto"],
        default="auto",
        help="Ingress mode: 'tunnel' (Cloudflare Quick Tunnel), 'lan' (Local Wi-Fi TLS), 'ngrok', or 'auto'"
    )
    parser.add_argument("--port", type=int, default=8000, help="Backend server port (default: 8000)")
    parser.add_argument("--lan-port", type=int, default=8443, help="LAN HTTPS proxy port (default: 8443)")

    args = parser.parse_args()

    mode = args.mode
    if mode == "lan":
        run_lan_https(args.lan_port)
    elif mode == "auto" or mode == "tunnel":
        ensure_backend_running(args.port)
        run_cloudflare_tunnel(args.port)
    elif mode == "ngrok":
        ensure_backend_running(args.port)
        run_ngrok(args.port)


if __name__ == "__main__":
    main()
