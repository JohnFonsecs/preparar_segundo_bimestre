import { api } from './api'

export type TripDetais = {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean;
}

async function getById(id: string) {
  try {
    const { data } = await api.get<{trip: TripDetais}>(`/trips/${id}`)
    return data.trip
  } catch (error) {
    throw error
  }
}

type CreateTrip = Omit<TripDetais, 'id' | 'is_confirmed'> & {emails_to_invite: string[]}

async function create({
  destination,
  starts_at,
  ends_at,
  emails_to_invite,
}:CreateTrip) {
  try {
    const { data } = await api.post<{tripId: string}>(`/trips`, {
      destination,
      starts_at,
      ends_at,
      emails_to_invite,
      owner_name : 'João Victor',
      owner_email : 'johnfonsecs@outlook.com',
    })
    return data
  } catch (error) {
    throw error
  }
}

export const tripServer = { getById, create }