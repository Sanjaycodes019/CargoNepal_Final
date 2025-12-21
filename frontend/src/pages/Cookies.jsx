import { Link } from 'react-router-dom';

const Cookies = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Cookie Policy
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                CargoNepal uses cookies and similar tracking technologies to enhance your browsing experience, analyze 
                website traffic, personalize content, and understand how visitors interact with our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Essential Cookies</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies are necessary for the Platform to function properly. They enable core functionality such as 
                security, network management, and accessibility. You cannot opt out of these cookies as they are essential 
                for the service to work.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Authentication cookies to keep you logged in</li>
                <li>Security cookies to protect against fraud</li>
                <li>Load balancing cookies for website performance</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Performance and Analytics Cookies</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our Platform by collecting and reporting 
                information anonymously. This helps us improve the way our website works.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Page views and navigation patterns</li>
                <li>Time spent on pages</li>
                <li>Error messages and performance issues</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Functionality Cookies</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies allow the Platform to remember choices you make (such as your username, language, or region) 
                and provide enhanced, personalized features.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>User preferences and settings</li>
                <li>Language selection</li>
                <li>Recent searches or bookings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Targeting and Advertising Cookies</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies may be set by our advertising partners to build a profile of your interests and show you 
                relevant advertisements on other websites. They do not directly store personal information but are based on 
                uniquely identifying your browser and internet device.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics, 
                deliver advertisements, and provide other services. These may include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Google Analytics:</strong> To analyze website traffic and user behavior</li>
                <li><strong>Payment Processors:</strong> To facilitate secure payment transactions</li>
                <li><strong>Social Media Platforms:</strong> To enable social media sharing and integration</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                These third parties may use cookies to collect information about your online activities across different 
                websites. We do not control these cookies, and you should check the third-party websites for more information 
                about their cookie practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How Long Do Cookies Last?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies can be either "session" or "persistent" cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li><strong>Session Cookies:</strong> These are temporary cookies that expire when you close your browser. 
                They are used to maintain your session while navigating the website.</li>
                <li><strong>Persistent Cookies:</strong> These remain on your device for a set period or until you delete them. 
                They help us recognize you when you return to our Platform and remember your preferences.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you can 
                usually modify your browser settings to decline cookies if you prefer. However, this may prevent you from 
                taking full advantage of the Platform's features.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Browser Settings</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can control cookies through your browser settings. Here are links to instructions for common browsers:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Apple Safari</li>
                <li>Microsoft Edge</li>
                <li>Opera</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">Opt-Out Tools</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can also opt out of certain third-party cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:underline">Google Analytics Opt-out</a></li>
                <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:underline">NAI Opt-out</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you choose to disable cookies, some features of our Platform may not function properly. This may include:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4 ml-4">
                <li>Difficulty staying logged in to your account</li>
                <li>Loss of saved preferences</li>
                <li>Reduced functionality of certain features</li>
                <li>Issues with payment processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Cookie Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
                operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new 
                policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
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
              Contact Us with Cookie Questions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;

