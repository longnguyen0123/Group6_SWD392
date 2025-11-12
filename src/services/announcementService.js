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


export const updateAnnouncement = (id, updatedData) => {
    return axios.put(`${API_URL}/${id}`, updatedData);
};


export const deleteAnnouncement = (id) => {
    return axios.delete(`${API_URL}/${id}`);
};