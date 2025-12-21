import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Terms of Service
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                By accessing and using CargoNepal ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                CargoNepal is a platform that connects customers with truck owners for cargo transportation services across Nepal. 
                We facilitate the connection between parties but are not directly involved in the actual transaction between customers and truck owners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use certain features of the Platform, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information to keep it accurate</li>
                <li>Maintain the security of your password and identification</li>
                <li>Accept all responsibility for activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Customers</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Provide accurate booking information including pickup/delivery locations, dates, and cargo details</li>
                <li>Make payments as agreed with the truck owner</li>
                <li>Comply with all applicable laws and regulations regarding cargo transportation</li>
                <li>Ensure cargo is legal and properly packaged</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Truck Owners</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Provide accurate truck information including capacity, dimensions, and rates</li>
                <li>Fulfill booking commitments in a timely and professional manner</li>
                <li>Maintain valid licenses, insurance, and permits</li>
                <li>Ensure vehicle safety and compliance with regulations</li>
                <li>Communicate clearly with customers about booking details</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Booking and Payment</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Bookings made through the Platform are agreements directly between customers and truck owners. 
                CargoNepal facilitates these connections but is not a party to the actual service contract.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Payment terms are agreed upon between customers and truck owners</li>
                <li>All disputes regarding payment must be resolved between the parties involved</li>
                <li>CargoNepal reserves the right to charge platform fees, which will be clearly disclosed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cancellation and Refunds</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cancellation policies may vary based on the agreement between customers and truck owners. 
                Please review booking details carefully before confirming.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Activities</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Use the Platform for any illegal purposes</li>
                <li>Transport illegal, hazardous, or prohibited items</li>
                <li>Provide false or misleading information</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the Platform's operation</li>
                <li>Attempt to gain unauthorized access to the Platform</li>
                <li>Use automated systems to access the Platform without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                CargoNepal acts as an intermediary platform. We are not responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Damage to cargo during transportation</li>
                <li>Delays in delivery</li>
                <li>Disputes between customers and truck owners</li>
                <li>Loss or theft of goods</li>
                <li>Accidents or incidents during transportation</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Users are encouraged to obtain appropriate insurance coverage for their cargo and operations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                All content on the Platform, including text, graphics, logos, and software, is the property of CargoNepal 
                or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We reserve the right to terminate or suspend your account and access to the Platform immediately, 
                without prior notice, for conduct that we believe violates these Terms of Service or is harmful to 
                other users, us, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any significant changes 
                via email or through the Platform. Continued use of the Platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms of Service are governed by and construed in accordance with the laws of Nepal. 
                Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Nepal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
              Contact Us for Questions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;

