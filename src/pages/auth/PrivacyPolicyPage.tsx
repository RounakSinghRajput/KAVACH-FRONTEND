import React, { useState } from "react";
import {
  Shield,
  BarChart3,
  Lock,
  Share2,
  Database,
  UserX,
  RefreshCw,
  Phone,
  Building2,
  Globe,
  MapPin,
  Menu,
  X,
  ChevronRight,
  FileText,
} from "lucide-react";
import IR from "../../myGallery/IR.jpeg";

export const PrivacyPolicy: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Privacy Policy", href: "#", active: true },
    // { name: "Terms & Conditions", href: "#" },
    // { name: "Contact Us", href: "#contact" },
  ];

  const sections = [
    { id: "info-collect", title: "1. Information We Collect", icon: Shield },
    { id: "usage-info", title: "2. Usage Information", icon: BarChart3 },
    { id: "data-security", title: "3. Data Security", icon: Lock },
    { id: "third-party", title: "4. Third-Party Services", icon: Share2 },
    { id: "data-retention", title: "5. Data Retention", icon: Database },
    { id: "children-privacy", title: "6. Children's Privacy", icon: UserX },
    { id: "policy-changes", title: "7. Changes to Policy", icon: RefreshCw },
    { id: "contact-us", title: "8. Contact Us", icon: Phone },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-[Inter,sans-serif]">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full p-2 h-10 w-10 flex items-center justify-center">
                <img
                  src={IR}
                  alt="Indian Railways Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="font-bold tracking-wide text-lg sm:text-xl">
                INDIAN RAILWAYS &bull; CRIS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.active
                      ? "bg-sky-800 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-300 hover:text-white p-2 rounded-md"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-800 px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  link.active
                    ? "bg-sky-800 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* Header Banner */}
      <header className="bg-gradient-to-r from-[#002244] via-[#003366] to-[#004080] text-white py-12 px-4 sm:px-6 shadow-xl rounded-b-3xl">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            SURAKSHA
          </h1>
          <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm text-sky-200 border border-white/20">
            System for Unified Reporting & Analysis for Kavach Safety & Health
            Assessment
          </div>
          <p className="text-xl sm:text-2xl text-sky-100 font-medium">
            Privacy Policy
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents / Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText size={18} className="text-sky-700" />
                Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="w-full text-left text-xs font-medium text-slate-600 hover:text-sky-700 hover:bg-sky-50 px-2 py-1.5 rounded transition flex items-center justify-between group"
                  >
                    <span className="truncate">{sec.title}</span>
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition"
                    />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Policy Cards */}
          <main className="lg:col-span-3 space-y-6">
            {/* Version & Metadata Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4 text-xs sm:text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-900">
                  Policy Version:
                </span>{" "}
                1.0
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  Last Updated:
                </span>{" "}
                21 July 2026
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  Effective Date:
                </span>{" "}
                21 July 2026
              </div>
            </div>

            {/* Introduction Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 leading-relaxed text-slate-700">
              <p>
                Centre for Railway Information Systems (CRIS) is committed to
                protecting your privacy while providing secure and reliable
                services through the{" "}
                <strong className="text-slate-900">SURAKSHA</strong> mobile
                application. This Privacy Policy explains how information is
                handled when you use the application within the official railway
                operations network.
              </p>
            </div>

            {/* Section 1 */}
            <section
              id="info-collect"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <Shield size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  1. Information We Collect
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                The SURAKSHA application does{" "}
                <strong className="text-slate-900">
                  not collect, store, or transmit personally identifiable
                  information
                </strong>{" "}
                such as your name, email address, phone number, or location for
                commercial purposes.
              </p>
              <p className="text-slate-700 leading-relaxed">
                The application may process operational data required for its
                intended functionality strictly within authorized railway
                systems.
              </p>
            </section>

            {/* Section 2 */}
            <section
              id="usage-info"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <BarChart3 size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  2. Usage Information
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                To improve the application's quality, stability, and
                performance, limited non-personal technical information may be
                collected, including:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-2">
                {[
                  "Application version",
                  "Device model",
                  "Operating system version",
                  "Crash reports",
                  "Performance analytics",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-sky-600"></span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-slate-700 leading-relaxed pt-2">
                This information is used solely to improve the application's
                functionality and user experience.
              </p>
            </section>

            {/* Section 3 */}
            <section
              id="data-security"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <Lock size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  3. Data Security
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                CRIS implements appropriate administrative, technical, and
                organizational security measures to protect information
                processed by the SURAKSHA application against unauthorized
                access, disclosure, alteration, or destruction.
              </p>
            </section>

            {/* Section 4 */}
            <section
              id="third-party"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <Share2 size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  4. Third-Party Services
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                The SURAKSHA application does not sell, rent, or share user
                information with third parties except where required by law or
                for official operational purposes.
              </p>
            </section>

            {/* Section 5 */}
            <section
              id="data-retention"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <Database size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  5. Data Retention
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Any operational data processed by the application is retained
                only for the period necessary to fulfill its intended purpose
                and in accordance with applicable Indian Railways policies and
                regulations.
              </p>
            </section>

            {/* Section 6 */}
            <section
              id="children-privacy"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <UserX size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  6. Children's Privacy
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                The SURAKSHA application is intended for authorized railway
                personnel and users, and is not designed for children under the
                age of 13.
              </p>
            </section>

            {/* Section 7 */}
            <section
              id="policy-changes"
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <RefreshCw size={22} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  7. Changes to this Privacy Policy
                </h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                CRIS reserves the right to update this Privacy Policy at any
                time. Changes will be reflected on this page along with the
                revised "Last Updated" date.
              </p>
            </section>

            {/* Section 8 - Contact Us */}
            <section
              id="contact-us"
              className="bg-gradient-to-br from-slate-900 to-[#002244] text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Phone size={22} className="text-sky-300" />
                </div>
                <h2 className="text-xl font-bold">8. Contact Us</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-200">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2
                      size={18}
                      className="text-sky-400 mt-1 shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        Centre for Railway Information Systems (CRIS)
                      </p>
                      <p className="text-slate-300">
                        Ministry of Railways, Govt. of India
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-sky-400 mt-1 shrink-0" />
                    <p className="text-slate-300">
                      Chanakyapuri, New Delhi – 110021, India.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-sky-400 shrink-0" />
                    <a
                      href="https://cris.org.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-300 hover:underline"
                    >
                      https://cris.org.in
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs sm:text-sm text-amber-900">
              <p className="font-semibold mb-1">Legal Notice:</p>
              <p>
                This application is developed and maintained by the Centre for
                Railway Information Systems (CRIS) for the Ministry of Railways,
                Government of India. Unauthorized access or usage is strictly
                prohibited.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Enterprise Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <p className="text-white font-bold text-base">
                Centre for Railway Information Systems
              </p>
              <p className="text-slate-400">
                Developed for Indian Railways | Ministry of Railways
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                Version 1.0
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500">
            <p>© 2026 CRIS | Government of India. All Rights Reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-slate-300 transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-300 transition">
                Terms of Use
              </a>
              <a href="#contact-us" className="hover:text-slate-300 transition">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
