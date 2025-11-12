import axios from 'axios';

const API_URL = 'http://localhost:3001/announcements';


export const fetchAnnouncements = async () => {
    const response = await axios.get(`${API_URL}?_sort=createdAt&_order=desc`);
    return response.data || [];
};


export const createAnnouncement = async (announcementData) => {
    const id = `ann_${Date.now()}`;
    const payload = { id, ...announcementData, createdAt: new Date().toISOString() };
    const response = await axios.post(API_URL, payload);
    return response.data;
};

/**
 * Updates an existing announcement.
 * @param {string} id - The ID of the announcement to update.
 * @param {object} updatedData - The new data for the announcement.
 * @returns {Promise<object>} A promise that resolves to the updated announcement data.
 */
export const updateAnnouncement = (id, updatedData) => {
    return axios.put(`${API_URL}/${id}`, updatedData);
};

/**
 * Deletes an announcement.
 * @param {string} id - The ID of the announcement to delete.
 * @returns {Promise<void>}
 */
export const deleteAnnouncement = (id) => {
    return axios.delete(`${API_URL}/${id}`);
};