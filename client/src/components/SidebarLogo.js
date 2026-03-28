import React from 'react';

const SidebarLogo = () => {
    return (
        <img 
            src={require('../assets/logo.png')} 
            alt="Smart SIP Logo" 
            style={{ width: '60px', height: '60px', objectFit: 'contain', display: 'block' }}
        />
    );
};

export default SidebarLogo;
