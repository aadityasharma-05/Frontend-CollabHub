import React, { createContext, useEffect, useState } from 'react';
import axios from '../config/axios.js';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(localStorage.getItem('token')));

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        axios.get('/users/profile')
            .then((res) => {
                if (res.data?.user) {
                    setUser(res.data.user);
                }
            })
            .catch((err) => {
                console.error('Profile fetch failed:', err);
                localStorage.removeItem('token');
                setUser(null);
            })
            .finally(() => {
                setIsAuthLoading(false);
            });
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isAuthLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
