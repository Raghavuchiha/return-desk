const express = require("express");

const {
  validateId,
  validateDetails,
  validateListQuery,
  validateTransition,
  validateNote,
} = require("../validators/returnsValidation");

const {
  listReturns,
  createReturn,
  getReturn,
  updateReturn,
  transitionReturn,
  addNote,
  removeReturn,
} = require("../services/returnsService");

const { routeNotFound, handleError } = require("../middleware/errors");

const router = express.Router();
router.use(express.json({ limit: "32kb" }));

router.get("/", async (request, response) => {
  const filters = validateListQuery(request.query);
  response.json(await listReturns(filters));
});

router.post("/", async (request, response) => {
  const details = validateDetails(request.body);
  const created = await createReturn(details);
  response.location(`/api/returns/${created.id}`).status(201).json({ data: created });
});

router.get("/:id", async (request, response) => {
  const id = validateId(request.params.id);
  response.json({ data: await getReturn(id) });
});

router.patch("/:id", async (request, response) => {
  const id = validateId(request.params.id);
  const changes = validateDetails(request.body, true);
  response.json({ data: await updateReturn(id, changes) });
});

router.post("/:id/transitions", async (request, response) => {
  const id = validateId(request.params.id);
  const transition = validateTransition(request.body);
  response.json({ data: await transitionReturn(id, transition) });
});

router.post("/:id/notes", async (request, response) => {
  const id = validateId(request.params.id);
  const body = validateNote(request.body);
  response.status(201).json({ data: await addNote(id, body) });
});

router.delete("/:id", async (request, response) => {
  const id = validateId(request.params.id);
  await removeReturn(id);
  response.status(204).end();
});

router.use(routeNotFound);
router.use(handleError);

module.exports = router;