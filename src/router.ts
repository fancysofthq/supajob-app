import { createRouter, createWebHashHistory } from "vue-router";
import { CID } from "multiformats/cid";
import { Account } from "@fancysofthq/supa-app/models/Account";

const Home = () => import("./pages/Home.vue");
const Job = () => import("./pages/Job.vue");
const Profile = () => import("./pages/Profile.vue");

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Home,
      meta: { name: "Home", doNotTerminateNProgress: true },
    },
    {
      path: "/job/:cid",
      component: Job,
      meta: {
        name: "Job",
        doNotTerminateNProgress: true,
      },
      props: (route) => ({
        cid: CID.parse(route.params.cid as string),
      }),
    },
    {
      path: "/:name(\\w+\\.eth|0x[0-9a-fA-F]{40})",
      component: Profile,
      meta: { name: "Profile" },
      props: (route) => {
        if ((route.params.name as string).endsWith(".eth")) {
          return {
            profileAccount: Account.getOrCreateFromEnsName(
              route.params.name as string
            ),
            displayTitle: true,
          };
        } else {
          return {
            profileAccount: Account.getOrCreateFromAddress(
              route.params.name as string
            ),
            displayTitle: true,
          };
        }
      },
    },
  ],
});

export default router;
