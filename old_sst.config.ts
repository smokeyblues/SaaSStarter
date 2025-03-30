/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "saasstarter",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const sb_anon_key = new sst.Secret("SB_ANON_KEY");
    const sb_url = new sst.Secret("SB_URL");
    const sb_srv_role = new sst.Secret("SB_SRV_ROLE");
    const stripe_secret = new sst.Secret("STRIPE_SECRET_KEY");

    new sst.aws.SvelteKit("MyWeb", {
      link: [sb_anon_key, sb_url, sb_srv_role, stripe_secret]
    });
  },
});
