const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");

const defaultSettings = {
  services: {
    assignment: { label: "Assignment Help", basePrice: 50 },
    task: { label: "Task Help", basePrice: 50 },
    ppt: { label: "PPT Making", basePrice: 50 },
    resume: { label: "Resume Builder", basePrice: 100 },
    project: { label: "Mini Project", basePrice: 250 },
    demo: { label: "Demo Service", basePrice: 1 },
    other: { label: "Other Academic Help", basePrice: 199 },
  },
  urgency: {
    normal: { label: "Normal (5-7 days)", multiplier: 1 },
    urgent: { label: "Urgent (2-3 days)", multiplier: 1.5 },
    express: { label: "Express (24 hours)", multiplier: 2 },
  },
};

let cachedSettings = { ...defaultSettings };

router.get("/", authenticate, async (req, res) => {
  try {
    return res.json(cachedSettings);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch settings", error: error.message });
  }
});

router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { services, urgency } = req.body;

    if (services) {
      cachedSettings.services = services;
    }
    if (urgency) {
      cachedSettings.urgency = urgency;
    }

    return res.json(cachedSettings);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update settings", error: error.message });
  }
});

router.post("/reset", authenticate, authorize("admin"), async (req, res) => {
  try {
    cachedSettings = { ...defaultSettings };
    return res.json(cachedSettings);
  } catch (error) {
    return res.status(500).json({ message: "Unable to reset settings", error: error.message });
  }
});

module.exports = router;