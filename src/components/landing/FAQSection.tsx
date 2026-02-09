import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What data format is supported?',
    answer: 'We support CSV files with customer attributes like tenure, monthly charges, contract type, and service usage. Our system automatically detects and maps common column names. You can also use our sample data to try the platform first.',
  },
  {
    question: 'How accurate is the model?',
    answer: 'Our XGBoost-based model achieves 95%+ accuracy on standard telecom churn datasets. Accuracy varies based on your specific data quality and feature availability. We provide confidence scores with every prediction.',
  },
  {
    question: 'Is this explainable AI?',
    answer: 'Yes! We use SHAP (SHapley Additive exPlanations) values to provide transparent, mathematically-grounded explanations for every prediction. You\'ll see exactly which factors drive each customer\'s risk score.',
  },
  {
    question: 'Can we integrate with our CRM?',
    answer: 'Absolutely. We offer API endpoints for real-time predictions and can integrate with Salesforce, HubSpot, and other major CRM platforms. Contact us for enterprise integration options.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Your data security is our priority. We use end-to-end encryption, never share your data with third parties, and offer on-premise deployment options for enterprises with strict data requirements.',
  },
  {
    question: 'What if I don\'t have historical churn data?',
    answer: 'Our pre-trained model works on standard customer attributes. While historical churn data improves accuracy, you can start getting insights immediately with basic customer information.',
  },
];

export function FAQSection() {
  return (
    <section className="py-24 px-4 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our churn prediction platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-foreground font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
