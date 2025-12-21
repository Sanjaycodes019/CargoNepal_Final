import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            About CargoNepal
          </h1>
          <p className="text-xl sm:text-2xl text-slate-200 max-w-3xl mx-auto">
            Connecting Nepal through trusted cargo transportation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Our Story */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                CargoNepal was founded by <strong>Govinda Gupta</strong> and <strong>Sanjay Gupta</strong>, 
                a father-son duo with a vision to transform the logistics industry in Nepal. What started as 
                a dream to connect businesses and individuals across the country has grown into a trusted 
                platform that serves thousands of customers daily.
              </p>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                Under the leadership of <strong>Sanjay Gupta</strong> as CEO, CargoNepal continues to 
                innovate and expand its services, ensuring fast, secure, and transparent logistics solutions 
                for everyone in Nepal.
              </p>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                Today, we are proud to be one of Nepal's leading cargo booking platforms, connecting customers 
                with reliable vehicle owners across the nation.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To revolutionize cargo transportation in Nepal by providing a transparent, reliable, and 
              efficient platform that connects customers with verified vehicle owners, ensuring seamless 
              logistics solutions for businesses and individuals nationwide.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To become Nepal's most trusted and innovative logistics platform, bridging distances and 
              enabling economic growth by making cargo transportation accessible, affordable, and reliable 
              for everyone, from small businesses to large enterprises.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Trust & Transparency',
                description: 'We believe in honest communication and transparent processes, building trust with every transaction.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                title: 'Reliability',
                description: 'We ensure timely delivery and consistent service quality, so you can count on us every time.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: 'Customer First',
                description: 'Your satisfaction is our priority. We listen, adapt, and continuously improve to serve you better.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              }
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="bg-slate-100 rounded-lg p-4 inline-flex mb-4">
                  <div className="text-slate-900">{value.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">Leadership</h2>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="bg-slate-100 rounded-full w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sanjay Gupta</h3>
                <p className="text-lg text-slate-600 mb-4">Chief Executive Officer (CEO)</p>
                <p className="text-gray-600 leading-relaxed">
                  Leading CargoNepal with dedication and innovation, Sanjay Gupta continues the legacy 
                  started with his father, driving the company towards excellence in Nepal's logistics sector.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="bg-slate-100 rounded-lg p-6 mb-6 md:mb-0 md:mr-8">
                <svg className="w-16 h-16 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Location</h3>
                <p className="text-lg text-gray-600 mb-2">
                  <strong>Bhairahawa, Nepal</strong>
                </p>
                <p className="text-gray-600">
                  Serving customers across Nepal with our headquarters based in Bhairahawa, 
                  strategically located to serve both eastern and western regions of the country.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg shadow-lg p-8 sm:p-10 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust CargoNepal for their transportation needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Sign Up Now
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

