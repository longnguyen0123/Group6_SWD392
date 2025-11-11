import { get, post, patch } from './api';

export const fetchUserTrips = (userId) => get(`/trips?userId=${userId}&endTime_ne=null&_sort=startTime&_order=desc`);
export const createTrip = (trip) => post('/trips', trip);
export const patchTrip = (id, body) => patch(`/trips/${id}`, body);
export const fetchTripById = (id) => get(`/trips/${id}`);


