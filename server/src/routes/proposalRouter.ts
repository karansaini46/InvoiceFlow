import { Router } from "express";

import { authMiddleware } from "../middleware/authMiddleware";
import {
  convertProposal,
  createProposal,
  deleteProposal,
  getProposal,
  getProposals,
  sendProposal,
  updateProposal,
  updateProposalStatus,
  viewPublicProposal,
} from "./proposals";

const router = Router();

const optionalAuth: typeof authMiddleware = (req, res, next) => {
  if (!req.header("authorization")) {
    next();
    return;
  }

  authMiddleware(req, res, next);
};

router.get("/:id/view", viewPublicProposal);
router.patch("/:id/status", optionalAuth, updateProposalStatus);

router.use(authMiddleware);

router.get("/", getProposals);
router.post("/", createProposal);
router.post("/:id/send", sendProposal);
router.post("/:id/convert", convertProposal);
router.get("/:id", getProposal);
router.patch("/:id", updateProposal);
router.delete("/:id", deleteProposal);

export { router as proposalRouter };
