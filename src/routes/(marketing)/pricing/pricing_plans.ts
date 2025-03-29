export const defaultPlanId = "free"

export const pricingPlans = [
  {
    id: "creative",
    name: "Creative",
    description: "A free plan to get you started!",
    price: "$0",
    priceIntervalName: "per month",
    stripe_price_id: null,
    features: ["MIT Licence", "Fast Performance", "Stripe Integration"],
  },
  {
    id: "producer",
    name: "Producer",
    description:
      "A plan to test the purchase experience. Try buying this with the test credit card 4242424242424242.",
    price: "$25",
    priceIntervalName: "per month",
    stripe_price_id: "price_1R85wgItMT7HUULI9X8ZJFHB",
    stripe_product_id: "prod_S2AH7QJBTUm9U1",
    features: [
      "Everything in Free",
      "Support us with fake money",
      "Test the purchase experience",
    ],
  },
  {
    id: "executive",
    name: "Executive Producer",
    description:
      "A plan to test the upgrade experience. Try buying this with the test credit card 4242424242424242.",
    price: "$50",
    priceIntervalName: "per month",
    stripe_price_id: "price_1R6xm3ItMT7HUULIah7Eoq8K",
    stripe_product_id: "prod_S0zl395AL36WqG",
    features: [
      "Everything in Pro",
      "Try the 'upgrade plan' UX",
      "Still actually free!",
    ],
  },
]
