import FAQItem from "./FAQItem";

const FAQSection = () => {
  const faqs = [
    {
      question: "Do you ship worldwide?",
      answer:
        "Yes! We ship to most countries globally. Shipping costs and delivery times may vary depending on your location.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Orders are typically processed within 24-48 hours. Delivery usually takes 3-7 business days depending on your region.",
    },
    {
      question: "Can I return or exchange an item?",
      answer:
        "Absolutely. You can return or exchange items within 14 days of delivery as long as they are unused and in original packaging.",
    },
    {
      question: "How can I track my order?",
      answer:
        "After checkout, you’ll receive a confirmation email with your tracking number and a link to follow your shipment’s progress.",
    },
  ];

  return (
    <section className=" text-black py-10 px-5 md:px-20">
      <h2 className="text-3xl  mb-6 text-center text-black/80 tracking-wide">
        Frequently Asked Questions
      </h2>

      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
