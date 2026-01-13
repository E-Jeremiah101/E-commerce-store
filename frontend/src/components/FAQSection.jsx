import FAQItem from "./FAQItem";
import ScrollReveal from "./ScrollReveal";
import { useStoreSettings } from "./StoreSettingsContext";


const FAQSection = () => {
  const {settings} = useStoreSettings();
  const faqs = [
    {
      question: "Do you ship worldwide?",
      answer:
        "We ship to locations available in our address selection. Please check during checkout to confirm if we deliver to your specific country or region.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Orders are typically processed within 24-48 hours. Delivery usually takes 3-7 business days depending on your region.",
    },
    {
      question: "Can I return or exchange an item?",
      answer:
        "We offer returns with refunds only (no exchanges). Items must be returned within 48 hours of delivery and must be unused with original packaging intact. Refunds are processed within 5-7 business days after we receive your return.",
    },
    {
      question: "How can I track my order?",
      answer:
        "After checkout, you'll receive an order confirmation email. We'll send you email updates as your order progresses, and you can always check the current status in your account under 'My Orders' on our website.",
    },
    {
      question: "How can I contact customer service?",
      answer: `You can contact our customer service team by email at  ${settings?.supportEmail}, or by calling our support line at ${settings?.phoneNumber} during business hours (9 AM - 6 PM, Monday to Friday).`,
    },
  ];

  return (
    <ScrollReveal direction="up" delay={0.10} duration={1}>
    <section className=" text-black py-10 px-5 md:px-20">
      {/* Section heading removed for homepage control */}

      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}
      </div>
    </section>
    </ScrollReveal>
  );
};

export default FAQSection;
