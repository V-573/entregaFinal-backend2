import { ticketDAO } from '../dao/ticket.dao.js';


class TicketRepository {
  async createTicket(ticketData) {


     return await ticketDAO.create(ticketData);
// const ticket = await ticketModel.create(ticketData);
//   // Poblamos el campo user para incluir first_name y last_name
//   return await ticket.populate('user');

  }

  async getById(id) {
    return await ticketDAO.getById(id);
  }

  async findActiveByUserAndEvent(userId, eventId) {
    return await ticketDAO.findActiveByUserAndEvent(userId, eventId);
  }

  async getOccupiedSlots(eventId) {
    return await ticketDAO.countOccupiedSlots(eventId);
  }

  async getTicketsByUser(userId) {
     return await ticketDAO.getTicketsByUser(userId);
// return await ticketModel.find({ user: userId })
//     .populate('event')  // Ya lo tenías
//     .populate('user');  // 👈 AGREGA ESTA LÍNEA para traer first_name y last_name

  }

  async getTicketsByEvent(eventId) {
    return await ticketDAO.getTicketsByEvent(eventId);
  }

  async cancelTicket(ticketId) {
   return await ticketDAO.cancelTicket(ticketId);


  }
}

export const ticketRepository = new TicketRepository();

