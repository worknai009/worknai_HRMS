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
        .psWrap{ padding: 16px; max-width: 1200px; margin: 0 auto; }
        .psHead{
          display:flex; justify-content:space-between; align-items:flex-end;
          gap: 12px; margin-bottom: 14px;
        }
        .psTitle{ margin:0; font-size: 22px; letter-spacing:-0.3px; color: #1e293b; }
        .psSub{ margin: 4px 0 0; opacity:0.7; font-size: 13px; color: #64748b; }
        .psRight{ display:flex; gap: 10px; align-items:center; flex-wrap: wrap; }
        .psCard{
          background:#fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          min-height: 400px;
        }
        @media (max-width: 768px){
          .psHead{ flex-direction:column; align-items:flex-start; }
          .psRight{ width:100%; justify-content:flex-start; }
        }
      `}</style>
    </div>
  );
};

export default PageShell;