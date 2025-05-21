'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TopNavbar from './components/TopNavbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import { chartTemplates } from './data/chartTemplates';
import { Visualization, ChartTemplate } from './types/visualization';

export default function Home() {
  const [projectName, setProjectName] = useState('Untitled Project');
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);

  // Handle adding a new visualization from template
  const handleTemplateSelect = (template: ChartTemplate) => {
    const newVisualization: Visualization = {
      id: uuidv4(),
      title: template.name,
      spec: template.spec,
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100
      },
      size: {
        width: template.spec.width || 300,
        height: template.spec.height || 200
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setVisualizations([...visualizations, newVisualization]);
  };

  // Handle moving visualization on canvas
  const handleVisualizationMove = (id: string, x: number, y: number) => {
    setVisualizations(
      visualizations.map((vis) =>
        vis.id === id
          ? { ...vis, position: { x, y }, updatedAt: new Date() }
          : vis
      )
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <TopNavbar projectName={projectName} onProjectNameChange={setProjectName} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-hidden p-2">
          <Canvas visualizations={visualizations} onVisualizationMove={handleVisualizationMove} />
        </main>
      </div>
    </div>
  );
}
