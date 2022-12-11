import { createRouter, createWebHashHistory } from "vue-router";
import { CID } from "multiformats/cid";
import * as api from "@/services/api";

const Home = () => import("./pages/Home.vue");
const Job = () => import("./pages/Job.vue");

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Home,
    },
    {
      path: "/job/:cid",
      component: Job,
      meta: {
        dto: null,
      },
      props: (route) => ({
        dto: route.meta.dto,
      }),
      beforeEnter: async (to, from, next) => {
        to.meta.dto = await api.getJob(CID.parse(to.params.cid as string));
        next();
      },
    },
  ],
});

export default router;
