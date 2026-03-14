import React from "react";

const PageShell = ({ title, subtitle, right, children }) => {
  return (
    <div className="psWrap">
      <div className="psHead">
        <div>
          <h1 className="psTitle">{title}</h1>
          {subtitle ? <p className="psSub">{subtitle}</p> : null}
        </div>
        <div className="psRight">{right}</div>
      </div>

      <div className="psCard">{children}</div>

      <style>{`
        .psWrap { padding: 24px; max-width: 1240px; margin: 0 auto; position: relative; z-index: 1; }
        .psHead {
          display:flex; justify-content:space-between; align-items:flex-end;
          gap: 20px; margin-bottom: 24px;
        }
        .psTitle { 
          margin:0; font-size: 26px; font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff, #a78bfa, #e879f9);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px; 
        }
        .psSub { margin: 6px 0 0; opacity:0.6; font-size: 14px; font-weight: 600; color: #fff; }
        .psRight { display:flex; gap: 12px; align-items:center; flex-wrap: wrap; }
        
        .psCard {
          background: rgba(13, 17, 34, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 26px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          min-height: 440px;
          color: #fff;
        }

        @media (max-width: 768px){
          .psWrap { padding: 16px; }
          .psHead { flex-direction:column; align-items:flex-start; }
          .psRight { width:100%; justify-content:flex-start; margin-top: 10px; }
          .psTitle { font-size: 22px; }
        }
      `}</style>
    </div>
  );
};

export default PageShell;