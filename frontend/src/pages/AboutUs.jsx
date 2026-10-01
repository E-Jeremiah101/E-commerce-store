import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
const AboutUs = () => {
  const values = [
    { title: "Craftsmanship", desc: "Every piece is chosen with intention." },
    { title: "Trust", desc: "Genuine products, honest pricing." },
    { title: "Integrity", desc: "We do right by our customers." },
    { title: "Innovation", desc: "Always improving your experience." },
    { title: "Customer First", desc: "You guide every decision we make." },
  ];

  const features = [
    {
      title: "Curated Quality",
      desc: "Hand-picked pieces that meet our standards never mass-listed filler.",
    },
    {
      title: "Secure Checkout",
      desc: "Encrypted payments and trusted processors, every single order.",
    },
    {
      title: "Fast Delivery",
      desc: "Orders dispatched quickly so your style doesn't have to wait.",
    },
    {
      title: "Verified Reviews",
      desc: "Real feedback from real customers no filtered praise.",
    },
    {
      title: "Responsive Support",
      desc: "A team that actually answers, and actually helps.",
    },
    {
      title: "Customer Obsessed",
      desc: "Every decision is measured by how it serves you.",
    },
  ];

  return (
    <div className="bg-white text-gray-900 antialiased">
      {/* Hero — editorial split */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-28 md:py-36 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7">
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-6">
              About Us
            </p>
            <h1 className="text-4xl md:text-6xl font-light leading-[1.1] tracking-tight">
              Fashion that feels
              <span className="block font-semibold">effortless.</span>
            </h1>
            <p className="mt-8 text-lg text-neutral-300 max-w-xl leading-relaxed">
              We're building a store where quality, style, and trust aren't
              upsells, they're the baseline.
            </p>
          </div>

         
        </div>
      </section>

      {/* Story — asymmetric, left-aligned */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
              Our Story
            </p>
            <h2 className="text-3xl md:text-4xl font-light leading-tight">
              Built on a simple idea.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-neutral-600 text-lg leading-relaxed">
            <p>
              We started with one frustration: online fashion shopping felt like
              a gamble. Inconsistent quality, unclear sizing, and stores that
              treated customers like order numbers.
            </p>
            <p>
              So we built the opposite. A curated collection where every item is
              chosen, not scraped. Transparent pricing. Secure payments. And a
              support team that treats your questions like they matter, because
              they do.
            </p>
            <p>
              Whether you're refreshing your wardrobe or looking for one piece
              that feels like *you*, our job is to make that easy, honest, and
              worth it.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision — side-by-side, minimal */}
      <section className="bg-neutral-50 py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16">
          {[
            {
              label: "Mission",
              title: "Make quality fashion accessible.",
              body: "Deliver products and experiences that earn trust  through reliability, care, and consistency.",
            },
            {
              label: "Vision",
              title: "Become the store you return to.",
              body: "A destination where style-seekers find pieces that inspire confidence and express who they are.",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                {item.label}
              </p>
              <h3 className="text-2xl md:text-3xl font-light leading-snug mb-4">
                {item.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us — clean grid, no heavy borders */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
              Why Shop With Us
            </p>
            <h2 className="text-3xl md:text-4xl font-light leading-tight">
              Six reasons customers keep coming back.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
            {features.map((f, i) => (
              <div key={f.title}>
                <span className="text-xs font-mono text-neutral-400">
                  0{i + 1}
                </span>
                <h4 className="mt-3 text-xl font-medium mb-2">{f.title}</h4>
                <p className="text-neutral-600 leading-relaxed text-[15px]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values — horizontal, minimal */}
      <section className="bg-neutral-950 text-white py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-10 text-center">
            Our Core Values
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <p className="text-xl md:text-2xl font-light">{v.title}</p>
                <p className="text-sm text-neutral-500 mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise — quiet, confident */}
      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6">
            Our Promise
          </p>
          <p className="text-2xl md:text-3xl font-light leading-snug text-neutral-800">
            Every order should feel worth it  from the moment you browse to the
            moment it arrives.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-100 py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-light leading-tight mb-6">
            Ready to upgrade your style?
          </h2>
          <p className="text-neutral-600 mb-10 max-w-xl mx-auto">
            Explore the latest collection and find pieces designed for your
            everyday.
          </p>
          <Link to={`/`}>
            <button className="px-10 py-4 bg-neutral-900 text-white text-sm font-medium tracking-wide rounded-full hover:bg-neutral-800 transition">
            Shop the Collection
            </button>
          </Link>
          
        </div>
      </section>
    </div>
  );
};

export default AboutUs;