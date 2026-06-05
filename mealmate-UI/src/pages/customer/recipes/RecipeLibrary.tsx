import React from "react";
import "./RecipeLibrary.css";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import RecipeBrowser from "./RecipeBrowser";

const RecipeLibrary: React.FC = () => {
  return (
    <div className="recipe-library-layout">
      <Sidebar />

      <div className="recipe-library-page">
        <Topbar title="Thư viện công thức" showSearch={false} />
        <RecipeBrowser variant="library" />
      </div>
    </div>
  );
};

export default RecipeLibrary;
