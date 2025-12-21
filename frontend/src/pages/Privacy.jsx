import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl sm:text-2xl text-slate-200 max-w-3xl mx-auto">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At CargoNepal, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform. Please read this policy carefully 
                to understand our practices regarding your personal data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Name, email address, and phone number</li>
                <li>Account credentials (password, encrypted)</li>
                <li>Profile information (address, business details for owners)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Truck details (for owners: registration, capacity, photos)</li>
                <li>Booking information (pickup/delivery locations, dates, cargo details)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Automatically Collected Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you use our Platform, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and facilitate bookings between customers and truck owners</li>
                <li>Send you service-related communications (bookings, confirmations, updates)</li>
                <li>Verify your identity and prevent fraudulent activity</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">With Other Users</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Customers and truck owners receive necessary information to complete bookings (contact details, booking information)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Service Providers</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>We may share data with third-party service providers who assist in operating our Platform (hosting, payment processing, email services)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Legal Requirements</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>If required by law or to protect our rights and the safety of users</li>
                <li>In connection with legal proceedings or government requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure password hashing</li>
                <li>Regular security assessments</li>
                <li>Limited access to personal information on a need-to-know basis</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. 
                While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Update:</strong> Correct or update your personal information through your account settings</li>
                <li><strong>Delete:</strong> Request deletion of your account and personal information</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                To exercise these rights, please contact us at cargonepal21@gmail.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, and assist with 
                marketing efforts. You can control cookies through your browser settings. For more information, 
                please see our <Link to="/cookies" className="text-slate-900 hover:underline">Cookies Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to provide our services, comply with legal 
                obligations, resolve disputes, and enforce our agreements. When you delete your account, we will delete 
                or anonymize your personal information, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If we become aware that we have collected information from a child, we will 
                take steps to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                new policy on this page and updating the "Last updated" date. We encourage you to review this policy 
                periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2"><strong>CargoNepal</strong></p>
                <p className="text-gray-700 mb-2"><strong>Email:</strong> cargonepal21@gmail.com</p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> +977 9766382090</p>
                <p className="text-gray-700"><strong>Location:</strong> Bhairahawa, Nepal</p>
              </div>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200 text-center">
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Contact Us with Privacy Concerns
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

