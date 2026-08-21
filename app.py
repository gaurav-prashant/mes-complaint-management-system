import streamlit as st
import base64
import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId

# =========================================================
# PAGE CONFIGURATION (Must be first Streamlit command)
# =========================================================

st.set_page_config(
    page_title="MES Complaint Corner",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# =========================================================
# DATABASE CONNECTION
# =========================================================

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = None
db = None
complaints_collection = None
mongo_connected = False


@st.cache_resource(ttl=3600)
def get_mongo_client(uri):
    """
    Returns a cached MongoClient instance.
    Pings the admin database to verify connectivity.
    """
    c = MongoClient(uri, serverSelectionTimeoutMS=5000)
    c.admin.command("ping")
    return c


if MONGO_URI:
    try:
        client = get_mongo_client(MONGO_URI)
        db = client["mes_complaint_db"]
        complaints_collection = db["complaints"]
        mongo_connected = True
        st.sidebar.success("🟢 MongoDB Connected")
    except Exception as e:
        st.sidebar.error("🔴 MongoDB Connection Failed")
        st.sidebar.write(str(e))
else:
    st.sidebar.error("🔴 MONGO_URI not found in .env")


# =========================================================
# PAGE STATE
# =========================================================

page = st.query_params.get("page", "home")


# =========================================================
# LOAD CSS
# =========================================================

def load_css():
    css_path = os.path.join(os.path.dirname(__file__), "Style.css")
    if not os.path.exists(css_path):
        css_path = os.path.join(os.path.dirname(__file__), "style.css")
    try:
        with open(css_path, "r", encoding="utf-8") as f:
            st.html(f"<style>{f.read()}</style>")
    except FileNotFoundError:
        st.error(
            "Style.css file not found. "
            "Please keep Style.css in the same folder as app.py."
        )


load_css()


# =========================================================
# ASSET HELPERS & IMAGE CACHING
# =========================================================

@st.cache_data
def get_image_b64_and_mime(filename):
    """
    Reads an image from assets/ and returns (base64_str, mime_type).
    Prefers optimized WebP format if available.
    """
    assets_dir = os.path.join(os.path.dirname(__file__), "assets")
    base_name, _ = os.path.splitext(filename)

    # Check WebP first for optimal performance
    webp_path = os.path.join(assets_dir, f"{base_name}.webp")
    if os.path.exists(webp_path):
        with open(webp_path, "rb") as f:
            return base64.b64encode(f.read()).decode(), "image/webp"

    # Fallback to requested filename (e.g. .png)
    orig_path = os.path.join(assets_dir, filename)
    if os.path.exists(orig_path):
        mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
        with open(orig_path, "rb") as f:
            return base64.b64encode(f.read()).decode(), mime

    return None, None


# =========================================================
# HERO IMAGE
# =========================================================

hero_b64, hero_mime = get_image_b64_and_mime("hero.png")

if hero_b64:
    st.html(
        f"""
        <style>
        .hero {{
            background:
                linear-gradient(
                    90deg,
                    rgba(3, 22, 51, 0.96) 0%,
                    rgba(5, 31, 67, 0.88) 40%,
                    rgba(5, 31, 67, 0.58) 75%,
                    rgba(5, 31, 67, 0.40) 100%
                ),
                url("data:{hero_mime};base64,{hero_b64}");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }}
        </style>
        """
    )
else:
    st.sidebar.warning("hero.png not found in assets folder.")


# =========================================================
# LOGO HELPER
# =========================================================

def get_logo_html():
    """
    Returns logo as a base64 image.
    If logo is not found, returns fallback emoji.
    """
    logo_b64, logo_mime = get_image_b64_and_mime("logo.png")

    if logo_b64:
        return (
            f'<img src="data:{logo_mime};base64,{logo_b64}" '
            f'alt="MES Logo" '
            f'style="width:72px;height:72px;'
            f'object-fit:cover;border-radius:14px;display:block;">'
        )

    return "🏛️"


def get_footer_brand_html():
    """
    Returns the footer logo and brand header HTML.
    """
    logo_b64, logo_mime = get_image_b64_and_mime("logo.png")

    if logo_b64:
        return (
            f'<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">'
            f'<img src="data:{logo_mime};base64,{logo_b64}" alt="MES Logo" style="width:38px;height:38px;object-fit:cover;border-radius:50%;display:block;">'
            f'<h3 style="color:#ffffff; font-size:22px; font-weight:800; margin:0; letter-spacing:0.2px;">MES System</h3>'
            f'</div>'
        )

    return '<h3 style="color:#ffffff; font-size:20px; margin-top:0;">🔴 MES System</h3>'




# =========================================================
# NAVBAR
# =========================================================

st.html(
    f"""
    <div class="navbar">

        <div class="logo-section">
            <div class="logo-box">
                {get_logo_html()}
            </div>
            <div>
                <div class="logo-title">
                    MES COMPLAINT CORNER
                </div>
                <div class="logo-subtitle">
                    Management by Efficiency &amp; Synergy
                </div>
            </div>
        </div>

        <!-- MOBILE MENU -->
        <input
            type="checkbox"
            id="mobile-menu-toggle"
            class="menu-toggle-checkbox"
        >

        <label
            for="mobile-menu-toggle"
            class="mobile-menu-btn"
            aria-label="Toggle navigation menu"
        >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        </label>

        <!-- NAV LINKS -->
        <div class="nav-links">
            <a
                href="?page=home"
                class="nav-link {'nav-active' if page == 'home' else ''}"
            >
                <svg
                    class="nav-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Home
            </a>

            <a
                href="?page=submit"
                class="nav-link {'nav-active' if page == 'submit' else ''}"
            >   
                <svg
                    class="nav-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect
                        x="2.5"
                        y="2.5"
                        width="19"
                        height="19"
                        rx="5"
                        stroke-width="1.8"
                        stroke-opacity="0.7"
                    />
                    <line x1="6.5" y1="8" x2="17.5" y2="8"/>
                    <line x1="6.5" y1="12" x2="17.5" y2="12"/>
                    <line x1="6.5" y1="16" x2="17.5" y2="16"/>
                </svg>
                Submit
            </a>

            <a
                href="?page=track"
                class="nav-link {'nav-active' if page == 'track' else ''}"
            >
                <svg
                    class="nav-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
                Track
            </a>

            <a
                href="?page=about"
                class="nav-link {'nav-active' if page == 'about' else ''}"
            >
                <svg
                    class="nav-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                </svg>
                About
            </a>


            <a
                href="?page=admin"
                class="nav-link admin-button {'nav-active' if page == 'admin' else ''}"
            >
                <svg
                    class="nav-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin
            </a>

            <a
                href="?page=super_admin"
                class="nav-link {'nav-active' if page == 'super_admin' else ''}"
            >
                <svg
                    class="nav-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Super Admin
            </a>
        </div>
    </div>
    """
)


# =========================================================
# HOME PAGE
# =========================================================

if page == "home":

    # HERO SECTION
    st.html(
        """
        <section class="hero">
            <div class="hero-content">
                <div class="hero-badge" style="color:#ffffff !important;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Trusted Complaint Management System</span>
                </div>
                <h1 style="color:#ffffff !important;">
                    Your Voice, <span style="color:#FFD54F !important;">Our Priority</span>
                </h1>
                <p style="color:#ffffff !important; font-size:18px; line-height:1.7; font-weight:500;">
                    Submit, track, and resolve complaints efficiently with our modern complaint management system.
                </p>
                <div class="hero-buttons">
                    <a
                        href="?page=submit"
                        class="primary-btn"
                        style="background: #ffffff !important; color: #b91c1c !important; border-radius: 10px !important; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) !important; font-weight: 700 !important; border: none !important;"
                    >
                        📝 &nbsp; Submit Complaint
                    </a>
                    <a
                        href="?page=track"
                        class="secondary-btn"
                        style="background: rgba(30, 20, 10, 0.5) !important; color: #ffffff !important; border: 1px solid rgba(255, 255, 255, 0.35) !important; border-radius: 10px !important; backdrop-filter: blur(8px) !important; font-weight: 600 !important;"
                    >
                        🔍 &nbsp; Track Status
                    </a>
                </div>
                <div class="developer-credit">
                    <span style="color:#ffffff !important;">
                        Developed by
                    </span>
                    <strong style="color:#FFD54F !important;">
                        Computer Cell 17 Bihar
                    </strong>
                </div>
            </div>
            <div class="hero-curve" style="position: absolute; bottom: -1px; left: 0; width: 100%; overflow: hidden; line-height: 0; z-index: 3; pointer-events: none;">
                <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style="position: relative; display: block; width: 100%; height: 75px; fill: #f7f9fc;">
                    <path d="M0,15 Q720,110 1440,15 L1440,120 L0,120 Z"></path>
                </svg>
            </div>
        </section>
        """
    )

    # STATISTICS
    total_count_str = "5000+"


    st.html(
        f"""
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-icon">
                    <span class="stat-symbol">✓</span>
                </div>
                <div>
                    <div class="stat-title">
                        Total Complaints
                    </div>
                    <div class="stat-value">
                        {total_count_str}
                    </div>
                    <div class="stat-desc">
                        Registered in system
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <span class="stat-symbol">◷</span>
                </div>
                <div>
                    <div class="stat-title">
                        Average Response Time
                    </div>
                    <div class="stat-value">
                        24hrs
                    </div>
                    <div class="stat-desc">
                        Quick response
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <span class="stat-symbol">⚡</span>
                </div>
                <div>
                    <div class="stat-title">
                        Satisfaction Rate
                    </div>
                    <div class="stat-value">
                        95%
                    </div>
                    <div class="stat-desc">
                        Citizen satisfaction
                    </div>
                </div>
            </div>
        </div>
        """
    )

    # WHY CHOOSE OUR SYSTEM
    st.html(
        """
        <div
            class="section-title"
            id="about"
        >
            Why Choose Our System?
        </div>

        <div class="section-line"></div>

        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">
                    📝
                </div>
                <h3>
                    Easy Submission
                </h3>
                <p>
                    Submit your complaints with a simple, intuitive form. Upload images and get instant confirmation.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    🔍
                </div>
                <h3>
                    Real-time Tracking
                </h3>
                <p>
                    Track your complaint status anytime with your mobile number. Get live updates on progress.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    ⚡
                </div>
                <h3>
                    Quick Resolution
                </h3>
                <p>
                    We prioritize your complaints and work towards fast resolution with dedicated support.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    🛡️
                </div>
                <h3>
                    Secure &amp; Private
                </h3>
                <p>
                    Your data is encrypted and secure. We maintain strict privacy standards for all complaints.
                </p>
            </div>
        </div>
        """
    )

    # CTA SECTION & FOOTER (Combined in single HTML block for 0px gap)
    st.html(f"""
<div class="cta" style="margin-bottom:0 !important;">
    <h2>Ready to Get Started?</h2>
    <p>Join thousands of satisfied users who trust our complaint management system</p>
    <a href="?page=submit" class="cta-btn">
        📄 &nbsp; Submit Your First Complaint &nbsp; →
    </a>
</div>

<div class="track-footer" style="background:#0b1224; color:#ffffff; padding:44px 8% 28px 8%; margin-top:0px !important; text-align:left;">
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:40px; max-width:1200px; margin:0 auto;">
        <div>
            {get_footer_brand_html()}
            <p style="color:rgba(255,255,255,0.75); font-size:13.5px; line-height:1.6; margin-top:10px;">
                Management by Efficiency &amp; Synergy.<br>Working together for a better tomorrow.
            </p>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Quick Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <a href="?page=home" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Home</a>
                <a href="?page=submit" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Submit Complaint</a>
                <a href="?page=track" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Track Status</a>
                <a href="?page=home#about" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">About Us</a>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Important Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>MES Official Website</span>
                <span>Government Services</span>
                <span>Help &amp; Support</span>
                <span>FAQ</span>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Need Help?</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>📞 1800-123-4567</span>
                <a href="mailto:support@mes-system.com" style="color:rgba(255,255,255,0.85); text-decoration:none;">✉️ support@mes-system.com</a>
                <span>🕐 Mon - Fri: 9:00 AM - 6:00 PM</span>
            </div>
        </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:35px; padding-top:22px; text-align:center; max-width:1200px; margin-left:auto; margin-right:auto;">
        <p style="margin-bottom:6px; color:rgba(255,255,255,0.85); font-size:13.5px;">Developed by <span style="color:#22c55e; font-weight:700;">Computer Cell 17 Bihar</span></p>
        <p style="font-size:12.5px; color:rgba(255,255,255,0.55); margin:0;">&copy; 2026 MES Complaint Management System. All rights reserved.</p>
    </div>
</div>
""")






# =========================================================
# SUBMIT COMPLAINT PAGE
# =========================================================

elif page == "submit":

    # TITLE BANNER
    st.html(
        """
        <div class="complaint-card">
            <div class="complaint-title">
                Submit Your Complaint
            </div>
            <div class="complaint-hindi-title">
                अपनी शिकायत दर्ज करें
            </div>
        </div>
        """
    )

    # FORM
    with st.form("complaint_form", clear_on_submit=True):

        # ROW 1
        col1, col2 = st.columns(2)
        with col1:
            name = st.text_input(
                "Full Name * / पूरा नाम *",
                placeholder="Enter your name / अपना नाम दर्ज करें"
            )

        with col2:
            mobile = st.text_input(
                "Mobile Number * / मोबाइल नंबर *",
                placeholder="10-digit mobile number / 10 अंकों का मोबाइल नंबर",
                max_chars=10
            )

        # ROW 2
        col1, col2 = st.columns(2)
        with col1:
            email = st.text_input(
                "Email Address (Optional) / ईमेल पता (वैकल्पिक)",
                placeholder="For notifications / सूचनाओं के लिए"
            )

        with col2:
            quarter = st.text_input(
                "Quarter Number * / क्वार्टर नंबर *",
                placeholder="e.g., B-104"
            )

        # ROW 3
        col1, col2 = st.columns(2)
        with col1:
            location = st.text_input(
                "Location/Area * / स्थान/क्षेत्र *",
                placeholder="e.g., M Zone, Nil Bhavan, K L Zone"
            )

        with col2:
            complaint_type = st.selectbox(
                "Complaint Type * / शिकायत का प्रकार *",
                [
                    "Select Type / प्रकार चुनें",
                    "Electrical / विद्युत",
                    "Civil / सिविल",
                    "Water Supply / जल आपूर्ति",
                    "Sanitation / स्वच्छता",
                    "Maintenance / रखरखाव",
                    "Security / सुरक्षा",
                    "Other / अन्य"
                ]
            )

        # DESCRIPTION
        description = st.text_area(
            "Description of Issue * / समस्या का विवरण *",
            placeholder=(
                "Please describe the problem in detail... / "
                "कृपया समस्या का विस्तार से वर्णन करें..."
            ),
            height=140
        )

        # IMAGE UPLOAD
        uploaded_images = st.file_uploader(
            "Upload Images (Max 3) / फोटो अपलोड करें (अधिकतम 3)",
            type=["jpg", "jpeg", "png"],
            accept_multiple_files=True,
            help="Supported: JPG, PNG (Max 2MB each)"
        )

        # CHECK OVERSIZED IMAGES
        oversized_images = []
        if uploaded_images:
            for image in uploaded_images:
                if image.size > 2 * 1024 * 1024:
                    oversized_images.append(image.name)

        # CHECK MAXIMUM 3 IMAGES
        if uploaded_images and len(uploaded_images) > 3:
            st.warning(
                "⚠️ Maximum 3 images allowed. "
                "अधिकतम 3 फोटो अपलोड कर सकते हैं।"
            )
            uploaded_images = uploaded_images[:3]

        # SUBMIT BUTTON
        submitted = st.form_submit_button(
            "Submit Complaint / शिकायत दर्ज करें  →",
            use_container_width=True
        )

        # VALIDATION & SUBMISSION HANDLER
        if submitted:
            if oversized_images:
                st.error(
                    "Each image must be 2MB or smaller. "
                    "कृपया 2MB से छोटी फोटो अपलोड करें।"
                )

            elif not name or not name.strip():
                st.error(
                    "Please enter your name / "
                    "कृपया अपना नाम दर्ज करें।"
                )

            elif len(mobile.strip()) != 10 or not mobile.strip().isdigit():
                st.error(
                    "Please enter a valid 10-digit mobile number / "
                    "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।"
                )

            elif not quarter or not quarter.strip():
                st.error(
                    "Please enter your quarter number / "
                    "कृपया क्वार्टर नंबर दर्ज करें।"
                )

            elif not location or not location.strip():
                st.error(
                    "Please enter location / "
                    "कृपया स्थान दर्ज करें।"
                )

            elif complaint_type == "Select Type / प्रकार चुनें":
                st.error(
                    "Please select complaint type / "
                    "कृपया शिकायत का प्रकार चुनें।"
                )

            elif not description or not description.strip():
                st.error(
                    "Please describe the issue / "
                    "कृपया समस्या का विवरण दें।"
                )

            else:
                # Process images into base64 format for storing in MongoDB
                images_data = []
                if uploaded_images:
                    for img in uploaded_images:
                        try:
                            img_bytes = img.read()
                            b64_str = base64.b64encode(img_bytes).decode('utf-8')
                            images_data.append({
                                "name": img.name,
                                "type": img.type,
                                "data": b64_str
                            })
                        except Exception:
                            pass

                complaint_data = {
                    "name": name.strip(),
                    "mobile": mobile.strip(),
                    "email": email.strip() if email else "",
                    "quarter": quarter.strip(),
                    "location": location.strip(),
                    "complaint_type": complaint_type,
                    "description": description.strip(),
                    "status": "Submitted",
                    "admin_remarks": "",
                    "images": images_data,
                    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }

                if complaints_collection is not None:
                    try:
                        result = complaints_collection.insert_one(complaint_data)
                        st.success(
                            "✅ Complaint submitted successfully! / "
                            "शिकायत सफलतापूर्वक दर्ज की गई!"
                        )
                        st.info(
                            f"📋 **Complaint ID**: `{result.inserted_id}` — "
                            f"Save this ID or enter mobile number `{mobile.strip()}` on the "
                            f"[Track Page](?page=track) to check progress."
                        )
                    except Exception as e:
                        st.error("❌ Complaint could not be saved to database.")
                        st.write(str(e))
                else:
                    st.error(
                        "❌ Database connection unavailable. "
                        "Please check MongoDB configuration."
                    )

    # SUBMIT PAGE FOOTER
    st.html(f"""
<div class="track-footer" style="background:#0b1224; color:#ffffff; padding:44px 8% 28px 8%; margin-top:20px !important; text-align:left;">
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:40px; max-width:1200px; margin:0 auto;">
        <div>
            {get_footer_brand_html()}
            <p style="color:rgba(255,255,255,0.75); font-size:13.5px; line-height:1.6; margin-top:10px;">
                Management by Efficiency &amp; Synergy.<br>Working together for a better tomorrow.
            </p>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Quick Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <a href="?page=home" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Home</a>
                <a href="?page=submit" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Submit Complaint</a>
                <a href="?page=track" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Track Status</a>
                <a href="?page=home#about" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">About Us</a>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Important Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>MES Official Website</span>
                <span>Government Services</span>
                <span>Help &amp; Support</span>
                <span>FAQ</span>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Need Help?</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>📞 1800-123-4567</span>
                <a href="mailto:support@mes-system.com" style="color:rgba(255,255,255,0.85); text-decoration:none;">✉️ support@mes-system.com</a>
                <span>🕐 Mon - Fri: 9:00 AM - 6:00 PM</span>
            </div>
        </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:35px; padding-top:22px; text-align:center; max-width:1200px; margin-left:auto; margin-right:auto;">
        <p style="margin-bottom:6px; color:rgba(255,255,255,0.85); font-size:13.5px;">Developed by <span style="color:#22c55e; font-weight:700;">Computer Cell 17 Bihar</span></p>
        <p style="font-size:12.5px; color:rgba(255,255,255,0.55); margin:0;">&copy; 2026 MES Complaint Management System. All rights reserved.</p>
    </div>
</div>
""")









# =========================================================
# TRACK COMPLAINT PAGE
# =========================================================

elif page == "track":

    st.html(
        """
        <div class="track-page-header">
            <h1 class="track-main-heading">
                Track Your Complaint
            </h1>
            <p class="track-main-sub">
                Enter your registered mobile number or 24-character Complaint ID to check real-time resolution progress.
            </p>
        </div>
        """
    )

    with st.form("track_form"):
        search_query = st.text_input(
            "Mobile Number or Complaint ID",
            placeholder="Enter 10-digit mobile number or Complaint ID"
        )

        track_submitted = st.form_submit_button(
            "🔍 Track Status",
            use_container_width=True
        )

    if track_submitted or search_query:
        query_val = search_query.strip() if search_query else ""

        if not query_val:
            st.error("Please enter a mobile number or Complaint ID to search.")
        elif complaints_collection is None:
            st.error("🔴 Database connection failed. Unable to fetch complaints.")
        else:
            records = []
            try:
                if len(query_val) == 24 and ObjectId.is_valid(query_val):
                    records = list(complaints_collection.find({"_id": ObjectId(query_val)}))
                if not records:
                    records = list(complaints_collection.find({"mobile": query_val}).sort("_id", -1))
            except Exception as e:
                st.error(f"Error querying database: {str(e)}")

            if records:
                st.html(f"""
                <div class="track-alert-success">
                    <span>✅</span> Found <strong>{len(records)}</strong> complaint(s) for query: <strong>{query_val}</strong>
                </div>
                """)

                for doc in records:
                    c_id    = str(doc.get("_id"))
                    status  = doc.get("status", "Submitted")
                    remarks = doc.get("admin_remarks", "")
                    created = doc.get("created_at", "")
                    updated = doc.get("updated_at", "")

                    # ── Badge class ──────────────────────────────────
                    badge_cls = {"In Progress": "track-badge-inprogress",
                                 "Resolved":    "track-badge-resolved",
                                 "Rejected":    "track-badge-rejected"}.get(status, "track-badge-submitted")

                    # ── Timeline timestamps ──────────────────────────
                    submitted_ts   = created or "—"
                    inprogress_ts  = doc.get("in_progress_at") or (updated if status in ["In Progress","Resolved"] else "")
                    resolved_ts    = updated if status == "Resolved" else ""
                    rejected_ts    = updated if status == "Rejected" else ""

                    # ── Normal timeline HTML (Submitted→In Progress→Resolved) ──
                    if status == "Rejected":
                        step1_icon = "tl-icon-done"
                        step2_icon = "tl-icon-rejected"
                        step2_lbl  = "tl-label-rejected"

                        timeline_html = f"""
                        <div class="tl-wrapper">
                            <div class="tl-title">STATUS TIMELINE</div>
                            <div class="tl-row">
                                <div class="tl-step">
                                    <div class="tl-icon {step1_icon}">✓</div>
                                    <div class="tl-label tl-label-done">Submitted</div>
                                    <div class="tl-ts">{submitted_ts}</div>
                                </div>
                                <div class="tl-connector tl-connector-done"></div>
                                <div class="tl-step">
                                    <div class="tl-icon {step2_icon}">✕</div>
                                    <div class="tl-label {step2_lbl}">Rejected</div>
                                    <div class="tl-ts">{rejected_ts}</div>
                                </div>
                            </div>
                        </div>
                        """
                    else:
                        s1_icon = "tl-icon-done" if status in ["In Progress","Resolved"] else "tl-icon-submitted"
                        s1_sym  = "✓"            if status in ["In Progress","Resolved"] else "✓"
                        s2_icon = "tl-icon-done"     if status == "Resolved" else ("tl-icon-inprogress" if status == "In Progress" else "tl-icon-pending")
                        s2_sym  = "✓"                if status == "Resolved" else ("✓" if status == "In Progress" else "2")
                        s2_lbl  = "tl-label-done"    if status == "Resolved" else ("tl-label-inprogress" if status == "In Progress" else "tl-label-pending")
                        s3_icon = "tl-icon-done"     if status == "Resolved" else "tl-icon-pending"
                        s3_sym  = "✓"                if status == "Resolved" else "3"
                        s3_lbl  = "tl-label-done"    if status == "Resolved" else "tl-label-pending"
                        c1_cls  = "tl-connector-done"   if status in ["In Progress","Resolved"] else "tl-connector-pending"
                        c2_cls  = "tl-connector-done"   if status == "Resolved"                 else "tl-connector-pending"

                        timeline_html = f"""
                        <div class="tl-wrapper">
                            <div class="tl-title">STATUS TIMELINE</div>
                            <div class="tl-row">
                                <div class="tl-step">
                                    <div class="tl-icon {s1_icon}">{s1_sym}</div>
                                    <div class="tl-label tl-label-done">Submitted</div>
                                    <div class="tl-ts">{submitted_ts}</div>
                                </div>
                                <div class="tl-connector {c1_cls}"></div>
                                <div class="tl-step">
                                    <div class="tl-icon {s2_icon}">{s2_sym}</div>
                                    <div class="tl-label {s2_lbl}">In Progress</div>
                                    <div class="tl-ts">{inprogress_ts}</div>
                                </div>
                                <div class="tl-connector {c2_cls}"></div>
                                <div class="tl-step">
                                    <div class="tl-icon {s3_icon}">{s3_sym}</div>
                                    <div class="tl-label {s3_lbl}">Resolved</div>
                                    <div class="tl-ts">{resolved_ts}</div>
                                </div>
                            </div>
                        </div>
                        """

                    # ── Email field (conditional) ────────────────────
                    email_row = ""
                    if doc.get("email"):
                        email_row = f"""
                        <div class="cd-item">
                            <div class="cd-icon cd-icon-email">✉</div>
                            <div><div class="cd-label">Email</div><div class="cd-value">{doc.get('email')}</div></div>
                        </div>"""

                    # ── Main card ────────────────────────────────────
                    st.html(f"""
                    <div class="tc-card">

                        <div class="tc-header">
                            <div class="tc-header-left">
                                <span class="track-badge {badge_cls}">{status}</span>
                                <span class="tc-cid">Complaint ID:&nbsp; <strong>{c_id}</strong></span>
                            </div>
                            <div class="tc-date">📅 Submitted: {created}</div>
                        </div>

                        {timeline_html}

                        <div class="cd-section-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                            COMPLAINT DETAILS
                        </div>
                        <div class="cd-grid">
                            <div class="cd-item">
                                <div class="cd-icon cd-icon-name">👤</div>
                                <div><div class="cd-label">Name</div><div class="cd-value">{doc.get('name','N/A')}</div></div>
                            </div>
                            <div class="cd-item">
                                <div class="cd-icon cd-icon-phone">📞</div>
                                <div><div class="cd-label">Mobile</div><div class="cd-value">{doc.get('mobile','N/A')}</div></div>
                            </div>
                            <div class="cd-item cd-item-desc">
                                <div class="cd-icon cd-icon-desc">📋</div>
                                <div><div class="cd-label">Description</div><div class="cd-value">{doc.get('description','N/A')}</div></div>
                            </div>
                            <div class="cd-item">
                                <div class="cd-icon cd-icon-qtr">🏠</div>
                                <div><div class="cd-label">Quarter</div><div class="cd-value">{doc.get('quarter','N/A')}</div></div>
                            </div>
                            <div class="cd-item">
                                <div class="cd-icon cd-icon-loc">📍</div>
                                <div><div class="cd-label">Location</div><div class="cd-value">{doc.get('location','N/A')}</div></div>
                            </div>
                            <div class="cd-item">
                                <div class="cd-icon cd-icon-type">🏷️</div>
                                <div><div class="cd-label">Type</div><div class="cd-value">{doc.get('complaint_type','N/A')}</div></div>
                            </div>
                            {email_row}
                        </div>

                    </div>
                    """)

                    # ── Remarks + Resolution side-by-side cards ───────
                    if status == "Resolved":
                        res_by   = doc.get("resolved_by") or "Admin"
                        res_date = updated or "N/A"
                        remarks_html = f"""
                        <div class="tc-remarks-card tc-remarks-green">
                            <div class="tc-rem-title tc-rem-title-green">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                ADMINISTRATIVE REMARKS
                            </div>
                            <div class="tc-rem-body">{remarks if remarks else '<em>No administrative remarks.</em>'}</div>
                            {'<div class="tc-rem-footer"><span>— Admin</span><span>' + res_date + '</span></div>' if remarks else ''}
                        </div>""" if True else ""

                        st.html(f"""
                        <div class="tc-bottom-row">
                            <div class="tc-remarks-card tc-remarks-green">
                                <div class="tc-rem-title tc-rem-title-green">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    ADMINISTRATIVE REMARKS
                                </div>
                                <div class="tc-rem-body">{remarks if remarks else '<em style="color:#94a3b8;">No administrative remarks.</em>'}</div>
                                {'<div class="tc-rem-footer"><span>— Admin</span><span>' + res_date + '</span></div>' if remarks else ''}
                            </div>
                            <div class="tc-remarks-card tc-remarks-green">
                                <div class="tc-rem-title tc-rem-title-green">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9,12 12,15 15,9"/></svg>
                                    RESOLUTION DETAILS
                                </div>
                                <div class="tc-res-grid">
                                    <div><div class="tc-res-label">Resolved By</div><div class="tc-res-value">{res_by}</div></div>
                                    <div><div class="tc-res-label">Resolution Date</div><div class="tc-res-value">{res_date}</div></div>
                                    <div><div class="tc-res-label">Status</div><div class="track-badge track-badge-resolved" style="display:inline-block;margin-top:4px;">RESOLVED</div></div>
                                </div>
                            </div>
                        </div>
                        """)

                    elif status == "Rejected":
                        st.html(f"""
                        <div class="tc-bottom-row">
                            <div class="tc-remarks-card tc-remarks-red" style="flex:1;">
                                <div class="tc-rem-title tc-rem-title-red">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    ADMINISTRATIVE REMARKS
                                </div>
                                <div class="tc-rem-body tc-rem-body-red">{remarks if remarks else '<em style="color:#fca5a5;">No rejection remarks provided.</em>'}</div>
                                {'<div class="tc-rem-footer tc-rem-footer-red"><span>— Admin</span><span>' + updated + '</span></div>' if remarks and updated else ''}
                            </div>
                        </div>
                        """)

                    else:
                        if remarks:
                            st.html(f"""
                            <div class="tc-remarks-card tc-remarks-blue" style="margin-top:0;">
                                <div class="tc-rem-title tc-rem-title-blue">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    ADMINISTRATIVE REMARKS
                                </div>
                                <div class="tc-rem-body">{remarks}</div>
                                {'<div class="tc-rem-footer tc-rem-footer-blue"><span>— Admin</span><span>' + updated + '</span></div>' if updated else ''}
                            </div>
                            """)
                        else:
                            st.html("""
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px; margin-bottom:16px; font-size:13px; color:#94a3b8;">
                                💬 <em>No administrative remarks yet.</em>
                            </div>
                            """)

                    # ── Attachments ──────────────────────────────────
                    imgs = doc.get("images", [])
                    if imgs:
                        st.markdown("**🖼️ Uploaded Attachments:**")
                        cols = st.columns(min(len(imgs), 3))
                        for idx, img_obj in enumerate(imgs):
                            try:
                                img_bytes = base64.b64decode(img_obj["data"])
                                cols[idx % 3].image(img_bytes, caption=img_obj.get("name", f"Image {idx+1}"), use_container_width=True)
                            except Exception:
                                pass

            else:
                st.warning(f"🔍 No complaints found matching **'{query_val}'**. Please verify your mobile number or ID.")

    # TRACK PAGE FOOTER
    st.html(f"""
<div class="track-footer" style="background:#0b1224; color:#ffffff; padding:44px 8% 28px 8%; margin-top:20px !important; text-align:left;">
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:40px; max-width:1200px; margin:0 auto;">
        <div>
            {get_footer_brand_html()}
            <p style="color:rgba(255,255,255,0.75); font-size:13.5px; line-height:1.6; margin-top:10px;">
                Management by Efficiency &amp; Synergy.<br>Working together for a better tomorrow.
            </p>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Quick Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <a href="?page=home" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Home</a>
                <a href="?page=submit" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Submit Complaint</a>
                <a href="?page=track" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Track Status</a>
                <a href="?page=home#about" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">About Us</a>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Important Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>MES Official Website</span>
                <span>Government Services</span>
                <span>Help &amp; Support</span>
                <span>FAQ</span>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Need Help?</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>📞 1800-123-4567</span>
                <a href="mailto:support@mes-system.com" style="color:rgba(255,255,255,0.85); text-decoration:none;">✉️ support@mes-system.com</a>
                <span>🕐 Mon - Fri: 9:00 AM - 6:00 PM</span>
            </div>
        </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:35px; padding-top:22px; text-align:center; max-width:1200px; margin-left:auto; margin-right:auto;">
        <p style="margin-bottom:6px; color:rgba(255,255,255,0.85); font-size:13.5px;">Developed by <span style="color:#22c55e; font-weight:700;">Computer Cell 17 Bihar</span></p>
        <p style="font-size:12.5px; color:rgba(255,255,255,0.55); margin:0;">&copy; 2026 MES Complaint Management System. All rights reserved.</p>
    </div>
</div>
""")




# =========================================================
# ABOUT PAGE
# =========================================================

elif page == "about":

    # 1. HERO BANNER
    st.html("""
    <div class="about-hero">
        <div class="about-hero-content">
            <div class="about-badge">
                <span style="font-size:15px;">ℹ️</span> &nbsp; About Our System
            </div>
            <h1 class="about-hero-title">
                Empowering You Through Better Communication
            </h1>
            <p class="about-hero-sub">
                Our Complaint Management System provides a transparent, efficient, and direct channel for citizens and residents to register, track, and resolve facility and service issues seamlessly.
            </p>
        </div>
    </div>
    """)

    # 2. FEATURE CARDS
    st.html("""
    <div class="about-container">
        <div class="about-section-header">
            <h2 class="about-section-title">Core Pillars of Our System</h2>
            <div class="about-section-line"></div>
        </div>
        <div class="about-features-grid">
            <div class="about-feature-card">
                <div class="about-feature-icon">⚡</div>
                <h3>Quick Response</h3>
                <p>Streamlined workflow ensures swift routing of complaints to responsible maintenance officers for fast turnaround times.</p>
            </div>
            <div class="about-feature-card">
                <div class="about-feature-icon">🔍</div>
                <h3>Transparent Tracking</h3>
                <p>Real-time status updates and end-to-end timeline visibility keep you informed at every stage of resolution.</p>
            </div>
            <div class="about-feature-card">
                <div class="about-feature-icon">🛡️</div>
                <h3>Secure &amp; Private</h3>
                <p>Enterprise-grade security and strict data privacy protocols protect your sensitive personal details.</p>
            </div>
        </div>
    </div>
    """)

    # 3. HOW IT WORKS TIMELINE
    st.html("""
    <div class="about-container" style="margin-top:55px;">
        <div class="about-section-header">
            <h2 class="about-section-title">How It Works</h2>
            <p style="color:#64748b; font-size:15px; margin:0 0 10px 0; font-weight:500;">Simple 3-step process to get your issues resolved</p>
            <div class="about-section-line"></div>
        </div>
        
        <div class="about-timeline">
            <div class="about-timeline-line"></div>
            <div class="about-timeline-grid">
                <div class="about-timeline-step">
                    <div class="about-step-number">01</div>
                    <h3>Submit</h3>
                    <p>Fill out our simple form with issue details and optional photo attachments.</p>
                </div>
                <div class="about-timeline-step">
                    <div class="about-step-number">02</div>
                    <h3>Track</h3>
                    <p>Receive a unique Complaint ID and monitor real-time resolution progress.</p>
                </div>
                <div class="about-timeline-step">
                    <div class="about-step-number">03</div>
                    <h3>Resolve</h3>
                    <p>Our maintenance team resolves the issue and updates status with admin remarks.</p>
                </div>
            </div>
        </div>
    </div>
    """)

    # 4. STATISTICS
    st.html("""
    <div class="about-container" style="margin-top:55px;">
        <div class="about-stats-grid">
            <div class="about-stat-box">
                <div class="about-stat-icon">📁</div>
                <div class="about-stat-num">5000+</div>
                <div class="about-stat-lbl">Complaints Resolved</div>
            </div>
            <div class="about-stat-box">
                <div class="about-stat-icon">⏱️</div>
                <div class="about-stat-num">24hrs</div>
                <div class="about-stat-lbl">Average Response Time</div>
            </div>
            <div class="about-stat-box">
                <div class="about-stat-icon">⭐</div>
                <div class="about-stat-num">95%</div>
                <div class="about-stat-lbl">User Satisfaction Rate</div>
            </div>
            <div class="about-stat-box">
                <div class="about-stat-icon">🕒</div>
                <div class="about-stat-num">24/7</div>
                <div class="about-stat-lbl">System Availability</div>
            </div>
        </div>
    </div>
    """)

    # 5. OUR MISSION
    st.html("""
    <div class="about-container" style="margin-top:55px; margin-bottom:50px;">
        <div class="about-mission-card">
            <h2 class="about-section-title" style="margin-bottom:10px !important;">Our Mission</h2>
            <div class="about-section-line" style="margin-bottom:20px;"></div>
            <p class="about-mission-text">
                To deliver a modern, reliable, and accessible complaint redressal platform that bridges the gap between citizens and service administration. We are committed to operational excellence, transparency, and continuous service enhancement.
            </p>
            <div class="about-badges-row">
                <span class="about-mission-badge">⚡ Fast Response</span>
                <span class="about-mission-badge">🎯 Goal-Oriented</span>
                <span class="about-mission-badge">👥 People-Centric</span>
            </div>
        </div>
    </div>
    """)

    # 6. UNIFIED FOOTER
    st.html(f"""
<div class="track-footer" style="background:#0b1224; color:#ffffff; padding:44px 8% 28px 8%; margin-top:20px !important; text-align:left;">
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:40px; max-width:1200px; margin:0 auto;">
        <div>
            {get_footer_brand_html()}
            <p style="color:rgba(255,255,255,0.75); font-size:13.5px; line-height:1.6; margin-top:10px;">
                Management by Efficiency &amp; Synergy.<br>Working together for a better tomorrow.
            </p>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Quick Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <a href="?page=home" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Home</a>
                <a href="?page=submit" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Submit Complaint</a>
                <a href="?page=track" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">Track Status</a>
                <a href="?page=about" style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px;">About Us</a>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Important Links</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>MES Official Website</span>
                <span>Government Services</span>
                <span>Help &amp; Support</span>
                <span>FAQ</span>
            </div>
        </div>
        <div>
            <h3 style="color:#ffffff; font-size:16px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px;">Need Help?</h3>
            <div style="display:flex; flex-direction:column; gap:8px; color:rgba(255,255,255,0.85); font-size:13.5px;">
                <span>📞 1800-123-4567</span>
                <a href="mailto:support@mes-system.com" style="color:rgba(255,255,255,0.85); text-decoration:none;">✉️ support@mes-system.com</a>
                <span>🕐 Mon - Fri: 9:00 AM - 6:00 PM</span>
            </div>
        </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:35px; padding-top:22px; text-align:center; max-width:1200px; margin-left:auto; margin-right:auto;">
        <p style="margin-bottom:6px; color:rgba(255,255,255,0.85); font-size:13.5px;">Developed by <span style="color:#22c55e; font-weight:700;">Computer Cell 17 Bihar</span></p>
        <p style="font-size:12.5px; color:rgba(255,255,255,0.55); margin:0;">&copy; 2026 MES Complaint Management System. All rights reserved.</p>
    </div>
</div>
""")




# =========================================================
# ADMIN DASHBOARD PAGE
# =========================================================

elif page == "admin":

    # ================= ADMIN PAGE CSS =================
    st.html("""
<style>
/* Edge-to-Edge Royal Blue Background */
html, body,
/* ===============================
   MAIN APP BACKGROUND
   =============================== */

/* ================================
   ADMIN DASHBOARD BACKGROUND
   ================================ */

.stApp,
[data-testid="stAppViewContainer"],
[data-testid="stMain"],
[data-testid="stMainBlockContainer"] {
    background: #f7f9fc !important;
    color: #17324d !important;
}

/* Main content */
[data-testid="stAppViewContainer"] {
    padding: 0 !important;
}

[data-testid="stMainBlockContainer"] {
    padding-top: 0 !important;
}

/* Headings */
h1, h2, h3, h4 {
    color: #17324d !important;
}
p, label {
    color: #17324d;
}

/* FOOTER */
footer {
    background: #071225 !important;
}

footer p,
footer span,
footer a,
footer h1,
footer h2,
footer h3,
footer h4 {
    color: white !important;
}

/* ================================
   INPUTS / SELECT BOX
   ================================ */

input,
textarea,
[data-baseweb="select"] > div {
    background: #ffffff !important;
    color: #17324d !important;
    border: 1px solid #d6dce5 !important;
    border-radius: 10px !important;
}

/* Placeholder */
input::placeholder,
textarea::placeholder {
    color: #8a98a8 !important;
}

/* ================================
   BUTTON
   ================================ */

button {
    border-radius: 10px !important;
}

/* ================================
   COMPLAINT CARD
   ================================ */

[data-testid="stExpander"] {
    background: #ffffff !important;
    border: 1px solid #d6dce5 !important;
    border-radius: 10px !important;
}

/* Expander text */
[data-testid="stExpander"] * {
    color: #17324d !important;
}

/* ================================
   FOOTER
   ================================ */

footer {
    background: #071225 !important;
}
/* Transparent Scrollbar */
::-webkit-scrollbar { width: 6px !important; }
::-webkit-scrollbar-track { background: transparent !important; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3) !important; border-radius: 4px !important; }

/* White Login Card */
div[data-testid="stForm"] {
    background: #ffffff !important;
    max-width: 480px !important;
    width: 100% !important;
    margin: 70px auto 60px auto !important;
    padding: 42px 44px 40px 44px !important;
    border-radius: 18px !important;
    box-shadow: 0 18px 45px rgba(0,0,0,0.22) !important;
    border: none !important;
    text-align: center !important;
}

/* Admin Header */
.admin-header { text-align: center; margin-bottom: 20px; }
.admin-shield { font-size: 52px; line-height: 1; margin-bottom: 10px; display: block; }
.admin-title-text { font-size: 30px; font-weight: 800; color: #102a43; margin-bottom: 4px; letter-spacing: -0.5px; }
.admin-sub-text { color: #627d98; font-size: 14px; margin-bottom: 24px; }

/* Form Labels */
div[data-testid="stForm"] label,
div[data-testid="stForm"] [data-testid="stWidgetLabel"] p {
    color: #1e293b !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    text-align: left !important;
}

/* Text Inputs */
div[data-testid="stForm"] input[type="text"],
div[data-testid="stForm"] input[type="password"] {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    color: #1e293b !important;
    font-size: 14.5px !important;
    height: 44px !important;
}

/* Login Button */
div[data-testid="stForm"] [data-testid="stFormSubmitButton"] button {
    background: #2563eb !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    border-radius: 8px !important;
    border: none !important;
    height: 46px !important;
    margin-top: 12px !important;
    box-shadow: 0 4px 14px rgba(37,99,235,0.35) !important;
}

div[data-testid="stForm"] [data-testid="stFormSubmitButton"] button:hover {
    background: #1d4ed8 !important;
}
</style>
""")

    # ================= AUTH STATE =================
    if "admin_authenticated" not in st.session_state:
        st.session_state.admin_authenticated = False

    # ================= LOGIN SCREEN =================
    if not st.session_state.admin_authenticated:
                # BLUE BACKGROUND ONLY FOR ADMIN LOGIN
        st.html("""
        <style>
        html,
        body,
        .stApp,
        [data-testid="stAppViewContainer"],
        [data-testid="stAppViewBlockContainer"],
        [data-testid="stMainBlockContainer"],
        [data-testid="stMain"],
        section.main,
        .main {
            background: linear-gradient(
                135deg,
                #27368d 0%,
                #343fb3 50%,
                #3f4bb8 100%
            ) !important;
        }
        </style>
        """)

        with st.form("admin_login_form"):
            st.html("""
<div class="admin-header">
    <div class="admin-shield">🛡️</div>
    <div class="admin-title-text">Admin Login</div>
    <div class="admin-sub-text">Complaint Management System</div>
</div>
""")

            email = st.text_input("Email", placeholder="admin@mes.gov.in")
            passcode = st.text_input("Password", type="password", placeholder="Enter password")
            login_btn = st.form_submit_button("Login", use_container_width=True)

            if login_btn:
                if email.strip().lower() == "admin@mes.gov.in" and passcode == "Admin@MES2026#":
                    st.session_state.admin_authenticated = True
                    st.success("Login successful!")
                    st.rerun()
                else:
                    st.error("Invalid email or password!")

    # ================= ADMIN DASHBOARD =================
    else:

        st.html("""
        <div class="admin-banner">
            <div>
                <div class="admin-banner-badge">
                    🛡️ ADMIN MANAGEMENT PORTAL
                </div>
                <h2 class="admin-banner-title">
                    Complaint Operations Dashboard
                </h2>
                <p class="admin-banner-sub">
                    Live Monitoring, Status Verification & Resolution Management
                </p>
            </div>
            <div>
                <span style="background:rgba(255,255,255,0.15); padding:8px 16px; border-radius:20px; font-size:13px; font-weight:600;">
                    🟢 System Online
                </span>
            </div>
        </div>
        """)

        col_space, col_logout = st.columns([5, 1])
        with col_logout:
            if st.button("🚪 Logout Admin", use_container_width=True):
                st.session_state.admin_authenticated = False
                st.rerun()

        if complaints_collection is None:
            st.error("🔴 MongoDB is not connected. Unable to load admin data.")
        else:
            try:
                all_complaints = list(complaints_collection.find().sort("_id", -1))
            except Exception as e:
                st.error(f"Error fetching complaints: {str(e)}")
                all_complaints = []

            total_c = len(all_complaints)
            submitted_c = sum(1 for c in all_complaints if c.get("status") == "Submitted")
            progress_c = sum(1 for c in all_complaints if c.get("status") == "In Progress")
            resolved_c = sum(1 for c in all_complaints if c.get("status") == "Resolved")
            rejected_c = sum(1 for c in all_complaints if c.get("status") == "Rejected")

            # 5 STAT KPI CARDS
            st.html(f"""
            <div class="kpi-grid">
                <div class="kpi-card" style="border-left: 4px solid #1e3a8a;">
                    <div class="kpi-icon-box" style="background:#eff6ff; color:#1e3a8a;">📊</div>
                    <div>
                        <div class="kpi-title">Total Complaints</div>
                        <div class="kpi-value">{total_c}</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid #2563eb;">
                    <div class="kpi-icon-box" style="background:#eff6ff; color:#2563eb;">⏳</div>
                    <div>
                        <div class="kpi-title">Submitted</div>
                        <div class="kpi-value">{submitted_c}</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid #d97706;">
                    <div class="kpi-icon-box" style="background:#fffbeab; color:#d97706;">🔄</div>
                    <div>
                        <div class="kpi-title">In Progress</div>
                        <div class="kpi-value">{progress_c}</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid #059669;">
                    <div class="kpi-icon-box" style="background:#ecfdf5; color:#059669;">✅</div>
                    <div>
                        <div class="kpi-title">Resolved</div>
                        <div class="kpi-value">{resolved_c}</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid #dc2626;">
                    <div class="kpi-icon-box" style="background:#fef2f2; color:#dc2626;">❌</div>
                    <div>
                        <div class="kpi-title">Rejected</div>
                        <div class="kpi-value">{rejected_c}</div>
                    </div>
                </div>
            </div>
            """)

            st.divider()

            # SEARCH & FILTER BOX
            f_col1, f_col2 = st.columns(2)
            with f_col1:
                filter_status = st.selectbox(
                    "Filter by Status",
                    ["All Statuses", "Submitted", "In Progress", "Resolved", "Rejected"]
                )
            with f_col2:
                search_term = st.text_input("Search Mobile / ID / Location / Name", placeholder="Type keyword...")

            filtered_list = all_complaints
            if filter_status != "All Statuses":
                filtered_list = [c for c in filtered_list if c.get("status") == filter_status]
            if search_term.strip():
                term = search_term.strip().lower()
                filtered_list = [
                    c for c in filtered_list
                    if term in str(c.get("_id")).lower()
                    or term in c.get("name", "").lower()
                    or term in c.get("mobile", "").lower()
                    or term in c.get("location", "").lower()
                    or term in c.get("complaint_type", "").lower()
                ]

            st.markdown(f"### 📋 Showing {len(filtered_list)} Complaint(s)")

            if not filtered_list:
                st.info("No complaints match the selected filter.")
            else:
                for doc in filtered_list:
                    c_id = str(doc.get("_id"))
                    current_status = doc.get("status", "Submitted")

                    status_badge = "#2563eb"
                    if current_status == "In Progress":
                        status_badge = "#d97706"
                    elif current_status == "Resolved":
                        status_badge = "#059669"
                    elif current_status == "Rejected":
                        status_badge = "#dc2626"

                    expander_label = f"📌 [{current_status}] ID: {c_id} - {doc.get('complaint_type')} ({doc.get('name')}, Qtr {doc.get('quarter')})"

                    with st.expander(expander_label):
                        c_col1, c_col2 = st.columns([1.6, 1])

                        with c_col1:
                            st.html(f"""
                            <div class="complaint-info-box">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                    <span style="background:{status_badge}; color:#ffffff; padding:4px 14px; border-radius:20px; font-weight:700; font-size:12px; letter-spacing:0.3px;">
                                        {current_status}
                                    </span>
                                    <span style="color:#64748b; font-size:12.5px; font-weight:500;">
                                        📅 Submitted: {doc.get('created_at', 'N/A')}
                                    </span>
                                </div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13.5px; color:#334155;">
                                    <div>👤 <strong>Name:</strong> {doc.get('name')}</div>
                                    <div>📞 <strong>Mobile:</strong> {doc.get('mobile')}</div>
                                    <div>🏠 <strong>Quarter:</strong> {doc.get('quarter')}</div>
                                    <div>📍 <strong>Location:</strong> {doc.get('location')}</div>
                                    <div>✉️ <strong>Email:</strong> {doc.get('email') or 'N/A'}</div>
                                    <div>🏷️ <strong>Type:</strong> {doc.get('complaint_type')}</div>
                                </div>
                                <div style="margin-top:12px; padding-top:10px; border-top:1px solid #e2e8f0;">
                                    <strong style="color:#1e293b; font-size:13.5px;">📝 Issue Description:</strong>
                                    <p style="color:#475569; font-size:14px; margin:4px 0 0 0; line-height:1.5; background:#ffffff; padding:10px 12px; border-radius:6px; border:1px solid #cbd5e1;">{doc.get('description')}</p>
                                </div>
                            </div>
                            """)

                            imgs = doc.get("images", [])
                            if imgs:
                                st.write("**🖼️ Uploaded Attachments:**")
                                img_cols = st.columns(min(len(imgs), 3))
                                for idx, img_obj in enumerate(imgs):
                                    try:
                                        img_bytes = base64.b64decode(img_obj["data"])
                                        img_cols[idx % 3].image(img_bytes, caption=img_obj.get("name", "Image"), use_container_width=True)
                                    except Exception:
                                        pass

                        with c_col2:
                            st.html("""
                            <div style="background:#eff6ff; padding:14px 16px; border-radius:10px; border:1px solid #bfdbfe; border-left:4px solid #2563eb; margin-bottom:10px;">
                                <div style="font-weight:800; color:#1e40af; font-size:13.5px; letter-spacing:0.2px;">
                                    ⚙️ Action &amp; Update Panel
                                </div>
                                <div style="font-size:12px; color:#3b82f6; margin-top:3px;">Update status and add administrative remarks</div>
                            </div>
                            """)
                            with st.form(f"update_form_{c_id}"):
                                status_options = ["Submitted", "In Progress", "Resolved", "Rejected"]
                                new_status = st.selectbox(
                                    "Update Status",
                                    status_options,
                                    index=status_options.index(current_status) if current_status in status_options else 0
                                )
                                remarks = st.text_area("Admin Remarks", value=doc.get("admin_remarks", ""), height=90, placeholder="Enter administrative remarks...")
                                update_submitted = st.form_submit_button("💾 Save Changes", use_container_width=True)

                                if update_submitted:
                                    try:
                                        complaints_collection.update_one(
                                            {"_id": doc["_id"]},
                                            {"$set": {
                                                "status": new_status,
                                                "admin_remarks": remarks.strip(),
                                                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                            }}
                                        )
                                        st.success("Updated successfully!")
                                        st.rerun()
                                    except Exception as ex:
                                        st.error(f"Failed to update: {str(ex)}")

    # ================= FOOTER =================
    st.html(f"""
<div class="track-footer" style="background:#0b1224; color:#ffffff; padding:40px 30px 25px 30px; margin-top:60px; text-align:left;">
    <div style="display:flex; justify-content:space-between; gap:50px; flex-wrap:wrap; max-width:1100px; margin:0 auto;">
        <div style="flex:1; min-width:250px;">
            {get_footer_brand_html()}
            <p style="color:#ffffff; font-size:14px; line-height:1.6;">Efficient complaint management for better service delivery.</p>
        </div>
        <div style="flex:1; min-width:200px;">
            <h3 style="color:#ffffff; font-size:18px; margin-top:0;">Quick Links</h3>
            <p style="margin:0 0 8px 0;"><a href="?page=submit" style="color:#ffffff; text-decoration:none; font-size:14px;">Submit Complaint</a></p>
            <p style="margin:0 0 8px 0;"><a href="?page=track" style="color:#ffffff; text-decoration:none; font-size:14px;">Track Status</a></p>
            <p style="margin:0;"><a href="?page=home#about" style="color:#ffffff; text-decoration:none; font-size:14px;">About Us</a></p>
        </div>
        <div style="flex:1; min-width:250px;">
            <h3 style="color:#ffffff; font-size:18px; margin-top:0;">Need Help?</h3>
            <p style="color:#ffffff; font-size:14px;">Contact our support team for assistance.</p>
            <p><a href="mailto:support@mes-system.com" style="color:#ffffff; text-decoration:none; font-weight:bold; font-size:14px;">support@mes-system.com</a></p>
        </div>
    </div>
    <div style="border-top:1px solid #263044; margin-top:30px; padding-top:25px; text-align:center; max-width:1100px; margin-left:auto; margin-right:auto;">
        <p style="margin-bottom:6px; color:#ffffff; font-size:14px;">Developed by <span style="color:#22c55e; font-weight:bold;">Computer Cell 17 Bihar</span></p>
        <p style="font-size:13px; color:#ffffff; margin:0;">© 2026 MES Complaint Management System. All rights reserved.</p>
    </div>
</div>
""")


# =========================================================
# SUPER ADMIN DASHBOARD PAGE
# =========================================================

elif page == "super_admin":

    # Super Admin Password Gate
    if "super_admin_authenticated" not in st.session_state:
        st.session_state.super_admin_authenticated = False

    if not st.session_state.super_admin_authenticated:

        # ── Scoped CSS: dark navy background + centered white card form ──
        st.html("""
        <style>
        /* ── 1. Dark navy gradient fills EVERY Streamlit container ── */
        [data-testid="stMainBlockContainer"],
        [data-testid="stVerticalBlock"],
        [data-testid="stVerticalBlockBorderWrapper"],
        [data-testid="block-container"] {
            background: linear-gradient(160deg, #0b1224 0%, #0f2048 50%, #0b1224 100%) !important;
        }

        /* ── 2. Zero out Streamlit padding so navbar/footer go edge-to-edge ── */
        [data-testid="stMainBlockContainer"] {
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow-x: hidden !important;
        }

        /* ── 3. White login card — centered, compact, 490px ── */
        [data-testid="stForm"] {
            background: #ffffff !important;
            border-radius: 18px !important;
            max-width: 490px !important;
            width: calc(100% - 40px) !important;
            margin: 55px auto 55px auto !important;
            padding: 38px 40px 34px 40px !important;
            box-shadow: 0 16px 60px rgba(0, 0, 0, 0.45) !important;
            border: none !important;
        }

        /* Remove default Streamlit form inner border */
        [data-testid="stForm"] > div {
            border: none !important;
            background: transparent !important;
        }

        /* ── 4. Input fields ── */
        [data-testid="stForm"] [data-testid="stTextInput"] input {
            border-radius: 8px !important;
            border: 1.5px solid #e2e8f0 !important;
            padding: 10px 14px !important;
            font-size: 14px !important;
            background: #f8fafc !important;
            color: #0f172a !important;
        }

        [data-testid="stForm"] [data-testid="stTextInput"] input:focus {
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
        }

        /* ── 5. Login button — blue/purple gradient ── */
        [data-testid="stFormSubmitButton"] > button {
            background: linear-gradient(135deg, #5046e5 0%, #7c3aed 100%) !important;
            color: #ffffff !important;
            border: none !important;
            border-radius: 10px !important;
            font-weight: 700 !important;
            font-size: 15px !important;
            padding: 13px 24px !important;
            width: 100% !important;
            cursor: pointer !important;
            letter-spacing: 0.3px !important;
            margin-top: 6px !important;
        }

        [data-testid="stFormSubmitButton"] > button:hover {
            background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
        }

        /* ── 6. Form element spacing ── */
        [data-testid="stForm"] [data-testid="stVerticalBlock"] {
            gap: 0 !important;
            background: transparent !important;
        }

        [data-testid="stForm"] [data-testid="element-container"] {
            margin-bottom: 4px !important;
            padding: 0 !important;
        }

        /* ── 7. Hide all Streamlit native footer / decoration elements ── */
        footer,
        [data-testid="stFooter"],
        [data-testid="stBottom"],
        .stBottom,
        [data-testid="stBottomBlockContainer"],
        [data-testid="stStatusWidget"],
        [data-testid="stDecoration"] {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
        }

        /* ── 8. Navbar flush at top ── */
        .navbar {
            margin-top: 0 !important;
            top: 0 !important;
        }

        /* ── 9. Footer — dark navy, no extra space ── */
        .sa-footer {
            background: #0b1224 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        </style>
        """)

        # ── Super Admin Login Form ──
        with st.form("super_admin_login"):
            st.html("""
            <div style="text-align:center; margin-bottom:22px;">
                <h2 style="color:#0f172a; font-size:26px; font-weight:800; margin:0 0 6px 0; letter-spacing:-0.5px;">Super Admin</h2>
                <p style="color:#64748b; font-size:13.5px; margin:0; font-weight:500;">Restricted Access</p>
            </div>
            """)

            sa_email = st.text_input("Email", placeholder="superadmin@mes.gov.in")
            sa_password = st.text_input("Password", type="password", placeholder="Enter password")

            login_btn = st.form_submit_button("Login as Super Admin", use_container_width=True)

            if login_btn:
                if sa_email.strip().lower() == "superadmin@mes.gov.in" and sa_password.strip() == "SuperAdmin@MES2026#":
                    st.session_state.super_admin_authenticated = True
                    st.success("✅ Super Admin Authenticated!")
                    st.rerun()
                else:
                    st.error("❌ Invalid Credentials!")

        # ── 3-Column Footer ──
        st.html(f"""
<div class="sa-footer">
  <div style="background:#0b1224; color:#ffffff; padding:40px 8% 24px 8%; border-top:1px solid rgba(255,255,255,0.1);">
    <div style="display:flex; justify-content:space-between; gap:40px; flex-wrap:wrap; max-width:1100px; margin:0 auto;">

      <!-- Col 1: Brand -->
      <div style="flex:1.2; min-width:220px;">
        {get_footer_brand_html()}
        <p style="color:rgba(255,255,255,0.7); font-size:13.5px; line-height:1.65; margin-top:10px; margin-bottom:0;">
          Efficient complaint management for better service delivery.
        </p>
      </div>

      <!-- Col 2: Quick Links -->
      <div style="flex:1; min-width:160px;">
        <h4 style="color:#ffffff; font-size:15px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.6px;">Quick Links</h4>
        <div style="display:flex; flex-direction:column; gap:9px;">
          <a href="?page=home"   style="color:rgba(255,255,255,0.8); text-decoration:none; font-size:13.5px;">Home</a>
          <a href="?page=submit" style="color:rgba(255,255,255,0.8); text-decoration:none; font-size:13.5px;">Submit Complaint</a>
          <a href="?page=track"  style="color:rgba(255,255,255,0.8); text-decoration:none; font-size:13.5px;">Track Status</a>
          <a href="?page=about"  style="color:rgba(255,255,255,0.8); text-decoration:none; font-size:13.5px;">About Us</a>
        </div>
      </div>

      <!-- Col 3: Need Help -->
      <div style="flex:1; min-width:200px;">
        <h4 style="color:#ffffff; font-size:15px; font-weight:700; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.6px;">Need Help?</h4>
        <p style="color:rgba(255,255,255,0.7); font-size:13.5px; line-height:1.6; margin:0 0 10px 0;">
          Contact our support team for assistance.
        </p>
        <a href="mailto:support@mes-system.com"
           style="color:rgba(255,255,255,0.85); text-decoration:none; font-size:13.5px; font-weight:600;">
          support@mes-system.com
        </a>
      </div>

    </div>

    <!-- Bottom bar -->
    <div style="border-top:1px solid rgba(255,255,255,0.08); margin-top:28px; padding-top:18px; text-align:center; max-width:1100px; margin-left:auto; margin-right:auto;">
      <p style="margin-bottom:4px; color:rgba(255,255,255,0.85); font-size:13.5px;">
        Developed by <span style="color:#22c55e; font-weight:700;">Computer Cell 17 Bihar</span>
      </p>
      <p style="font-size:12.5px; color:rgba(255,255,255,0.5); margin:0;">
        &copy; 2026 MES Complaint Management System. All rights reserved.
      </p>
    </div>
  </div>
</div>
""")




    else:
        st.markdown(
            """
            <div style="text-align:center; padding:30px 20px; max-width:800px; margin:0 auto;">
                <h1 style="color:#0f172a; font-size:32px; font-weight:800; margin-bottom:8px;">
                    👑 Super Admin Management Portal
                </h1>
                <p style="color:#64748b; font-size:15px;">
                    System analytics, batch data export, and database governance controls.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Top Toolbar
        col_title, col_logout = st.columns([4, 1])
        with col_logout:
            if st.button("🚪 Exit Super Admin", use_container_width=True):
                st.session_state.super_admin_authenticated = False
                st.rerun()

        if complaints_collection is None:
            st.error("🔴 Database connection unavailable.")
        else:
            try:
                all_complaints = list(complaints_collection.find().sort("_id", -1))
            except Exception as e:
                st.error(f"Database error: {str(e)}")
                all_complaints = []

            # Key Overview Stats
            total_count = len(all_complaints)
            resolved_count = sum(1 for c in all_complaints if c.get("status") == "Resolved")
            res_rate = round((resolved_count / total_count * 100), 1) if total_count > 0 else 0

            c1, c2, c3 = st.columns(3)
            c1.metric("Total System Complaints", total_count)
            c2.metric("Total Resolved", resolved_count)
            c3.metric("Resolution Rate", f"{res_rate}%")

            st.divider()

            # Breakdown by Category
            st.subheader("📊 Complaints by Category")
            type_counts = {}
            for c in all_complaints:
                ctype = c.get("complaint_type", "Other")
                type_counts[ctype] = type_counts.get(ctype, 0) + 1

            if type_counts:
                st.bar_chart(type_counts)
            else:
                st.info("No complaint data available for charts.")

            st.divider()

            # Data Export & Governance
            st.subheader("⚙️ System Operations & Data Export")

            col_export, col_purge = st.columns(2)

            with col_export:
                st.markdown("##### 📥 Export Data")
                st.write("Download all system complaint records in JSON format.")

                # Prepare JSON without binary image payload for clean export
                export_data = []
                for c in all_complaints:
                    c_copy = dict(c)
                    c_copy["_id"] = str(c_copy["_id"])
                    if "images" in c_copy:
                        c_copy["images_count"] = len(c_copy["images"])
                        del c_copy["images"]
                    export_data.append(c_copy)

                import json
                json_str = json.dumps(export_data, indent=2)

                st.download_button(
                    label="Download Complaints JSON",
                    data=json_str,
                    file_name=f"mes_complaints_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    mime="application/json",
                    use_container_width=True
                )

            with col_purge:
                st.markdown("##### ⚠️ Delete Individual Complaint")
                del_id = st.text_input("Enter Complaint ID to delete", placeholder="24-character ObjectId")
                if st.button("Delete Complaint", type="primary", use_container_width=True):
                    if len(del_id.strip()) == 24 and ObjectId.is_valid(del_id.strip()):
                        try:
                            res = complaints_collection.delete_one({"_id": ObjectId(del_id.strip())})
                            if res.deleted_count > 0:
                                st.success(f"Complaint {del_id} deleted successfully.")
                                st.rerun()
                            else:
                                st.warning("Complaint ID not found.")
                        except Exception as ex:
                            st.error(f"Error deleting complaint: {str(ex)}")
                    else:
                        st.error("Please enter a valid 24-character Complaint ID.")

