import { useState } from 'react';
import { Link } from 'react-router-dom';

const Help = () => {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const helpSections = [
    {
      title: 'Getting Started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      guides: [
        {
          question: 'How do I create an account?',
          answer: 'Click on "Sign Up" in the navigation bar, choose your role (Customer or Owner), fill in your details, verify your email with the OTP sent to your inbox, and you\'re all set!'
        },
        {
          question: 'What\'s the difference between a Customer and Owner account?',
          answer: 'Customers can browse and book trucks for their cargo transportation needs. Owners can register their trucks and receive booking requests from customers.'
        },
        {
          question: 'Do I need to verify my email?',
          answer: 'Yes, email verification is required for security purposes. You\'ll receive an OTP code via email that you need to enter to activate your account.'
        }
      ]
    },
    {
      title: 'Booking a Truck',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      guides: [
        {
          question: 'How do I book a truck?',
          answer: 'Browse available trucks on the Trucks page, click on a truck to see details, fill in your booking information (pickup location, delivery location, date, cargo details), and submit your booking request. The owner will review and confirm your booking.'
        },
        {
          question: 'How is pricing calculated?',
          answer: 'Pricing is calculated based on distance (kilometers) and the rate per kilometer set by the truck owner. The system automatically calculates the total cost based on your pickup and delivery locations.'
        },
        {
          question: 'Can I cancel a booking?',
          answer: 'Yes, you can cancel a booking from your dashboard. However, cancellation policies may vary depending on the booking status and owner\'s terms. Please check the booking details for more information.'
        },
        {
          question: 'What information do I need to provide for booking?',
          answer: 'You\'ll need to provide: pickup location, delivery location, preferred date, cargo description, cargo weight, and any special requirements or instructions.'
        }
      ]
    },
    {
      title: 'For Truck Owners',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      guides: [
        {
          question: 'How do I register my truck?',
          answer: 'Sign up as an Owner, go to your dashboard, click "Add Truck", fill in your truck details (type, capacity, dimensions, rate per km, availability), upload truck photos, and submit. Your truck will be available for bookings once approved.'
        },
        {
          question: 'How do I manage booking requests?',
          answer: 'You\'ll receive booking requests in your Owner Dashboard. Review each request, check the details, and accept or reject based on your availability. You can also communicate with customers through the platform.'
        },
        {
          question: 'How do I set my rates?',
          answer: 'You can set your rate per kilometer when adding or editing your truck. This rate is used to automatically calculate the total booking cost for customers. Make sure your rates are competitive and fair.'
        },
        {
          question: 'What truck information is required?',
          answer: 'You need to provide: truck type, capacity (tons), dimensions (length, width, height), rate per kilometer, registration number, and photos of your truck.'
        }
      ]
    },
    {
      title: 'Payment & Pricing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      guides: [
        {
          question: 'What payment methods are accepted?',
          answer: 'Payment methods may vary. Please check with the truck owner or refer to the booking details for accepted payment options. Common methods include cash, bank transfer, or digital wallets.'
        },
        {
          question: 'When do I pay?',
          answer: 'Payment terms are typically discussed between you and the truck owner. Some require advance payment, while others accept payment upon delivery. Check the booking confirmation for payment details.'
        },
        {
          question: 'Are there any platform fees?',
          answer: 'Platform fees, if any, will be clearly displayed during the booking process. Review all costs before confirming your booking.'
        }
      ]
    },
    {
      title: 'Account & Security',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      guides: [
        {
          question: 'How do I reset my password?',
          answer: 'Click "Forgot password?" on the login page, enter your email, verify the OTP sent to your email, and set a new password. Make sure to use a strong, unique password.'
        },
        {
          question: 'How do I update my profile?',
          answer: 'Log in to your account, go to your Profile page, update your information, and save the changes. Make sure your contact information is always up to date.'
        },
        {
          question: 'Is my information safe?',
          answer: 'Yes, we take your privacy and security seriously. All data is encrypted and stored securely. Please refer to our Privacy Policy for more details.'
        }
      ]
    },
    {
      title: 'Troubleshooting',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      guides: [
        {
          question: 'I didn\'t receive the OTP email',
          answer: 'Check your spam/junk folder, ensure your email address is correct, and wait a few minutes. You can request a new OTP after 30 seconds. If the problem persists, contact our support team.'
        },
        {
          question: 'My booking isn\'t showing up',
          answer: 'Refresh your dashboard page. If it still doesn\'t appear, check your internet connection and try logging out and back in. If the issue continues, contact support.'
        },
        {
          question: 'The website is loading slowly',
          answer: 'Check your internet connection, clear your browser cache, or try using a different browser. If the problem persists, it might be a temporary server issue.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Help Center
          </h1>
          <p className="text-xl sm:text-2xl text-slate-200 max-w-3xl mx-auto">
            Find answers to common questions and get the help you need
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/register"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-3">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create Account</h3>
            </div>
            <p className="text-gray-600 text-sm">New to CargoNepal? Sign up and get started</p>
          </Link>

          <Link
            to="/contact"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-3">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Support</h3>
            </div>
            <p className="text-gray-600 text-sm">Can't find what you need? Get in touch</p>
          </Link>

          <Link
            to="/faq"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-3">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">View FAQs</h3>
            </div>
            <p className="text-gray-600 text-sm">Browse frequently asked questions</p>
          </Link>
        </div>

        {/* Help Sections */}
        <div className="space-y-6">
          {helpSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <div className="bg-slate-100 rounded-lg p-3 mr-4">
                    <div className="text-slate-900">{section.icon}</div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <svg
                  className={`w-6 h-6 text-gray-400 transition-transform ${openSection === sectionIndex ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openSection === sectionIndex && (
                <div className="px-6 pb-6">
                  <div className="space-y-4 mt-4">
                    {section.guides.map((guide, guideIndex) => (
                      <div key={guideIndex} className="border-l-4 border-slate-900 pl-4 py-2">
                        <h3 className="font-semibold text-gray-900 mb-2">{guide.question}</h3>
                        <p className="text-gray-600 leading-relaxed">{guide.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg shadow-lg p-8 sm:p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Our support team is available 24/7 to assist you
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Help;

