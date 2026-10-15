import { ticketModel } from '../models/ticket.model.js';
import mongoose from 'mongoose';

class TicketDAO {
  async create(ticketData) {
    const newTicket = await ticketModel.create(ticketData);
    // Poblamos user y event para que el DTO tenga los datos completos desde la creación
    const populatedTicket = await ticketModel.findById(newTicket._id)
      .populate({ path: 'user', select: 'first_name last_name email' })
      .populate({ path: 'event', select: 'title date location time price status' })
      .lean();
      
    return populatedTicket;
  }

  async getById(id) {
    return await ticketModel.findById(id)
      .populate({ path: 'user', select: 'first_name last_name email' })
      .populate({ path: 'event', select: 'title date location time price status organizer' })
      .lean();
  }

  async findActiveByUserAndEvent(userId, eventId) {
    return await ticketModel.findOne({
      user: userId,
      event: eventId,
      status: { $ne: 'cancelled' }
    });
  }

  // Cuenta la suma total de 'quantity' en tickets activos (confirmed y pending)
  async countOccupiedSlots(eventId) {
    const objectId = typeof eventId === 'string' ? new mongoose.Types.ObjectId(eventId) : eventId;

    const result = await ticketModel.aggregate([
      {
        $match: {
          event: objectId,
          status: { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: '$quantity' }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalReserved : 0;
  }

  async getTicketsByUser(userId) {
    return await ticketModel.find({ user: userId })
      .populate({
        path: 'event',
        select: 'title date location time price status'
      })
      .populate({ path: 'user', select: 'first_name last_name email' }) // 👈 Agregado para que no salga fullName vacío
      .lean();
  }

  async getTicketsByEvent(eventId) {
    return await ticketModel.find({ event: eventId })
      .populate({
        path: 'user',
        select: 'first_name last_name email'
      })
      .populate({ path: 'event', select: 'title date location time price status' }) // 👈 Opcional: para incluir datos del evento
      .lean();
  }

  async cancelTicket(ticketId) {
    return await ticketModel.findByIdAndUpdate(
      ticketId,
      {
        status: 'cancelled',
        cancelledAt: new Date()
      },
      { new: true }
    )
    .populate({ path: 'user', select: 'first_name last_name email' }) // 👈 Agregado para que retorne el usuario poblado al cancelar
    .populate({ path: 'event', select: 'title date location time price status' }) // 👈 Agregado para que el evento también esté poblado
    .lean();
  }
}

export const ticketDAO = new TicketDAO();