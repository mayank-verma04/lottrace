const apiResponse = require('../../utils/apiResponse');
const eventsService = require('./events.service');
const { getEventsQuerySchema } = require('./events.validation');

const createEvent = async (req, res) => {
  const event = await eventsService.createEvent(req.validatedBody, req.organizationId, req.user.id);
  return apiResponse.created(res, event, 'Event created successfully');
};

const getEvents = async (req, res) => {
  // Validate query string
  const query = getEventsQuerySchema.parse(req.query);
  const { data, pagination } = await eventsService.getEvents(query, req.organizationId);
  return apiResponse.paginated(res, data, pagination, 'Events fetched successfully');
};

const getEvent = async (req, res) => {
  const event = await eventsService.getEventById(req.params.eventId, req.organizationId);
  return apiResponse.success(res, event, 'Event fetched successfully');
};

const voidEvent = async (req, res) => {
  const event = await eventsService.voidEvent(req.params.eventId, req.validatedBody.voidReason, req.organizationId);
  return apiResponse.success(res, event, 'Event voided successfully');
};

const amendEvent = async (req, res) => {
  const event = await eventsService.amendEvent(req.params.eventId, req.validatedBody, req.organizationId, req.user.id);
  return apiResponse.created(res, event, 'Event amended successfully');
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  voidEvent,
  amendEvent,
};
