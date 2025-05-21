import React from 'react';
import { FiSave, FiShare2, FiSettings, FiHelpCircle, FiUser } from 'react-icons/fi';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface TopNavbarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ projectName, onProjectNameChange }) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-xl font-semibold text-blue-600">VISplora</div>
        <div className="h-6 w-[1px] bg-slate-200"></div>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="text-sm font-medium border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 max-w-[200px]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="text-sm text-slate-600 font-medium hover:bg-slate-50 px-3 py-1.5 rounded-md flex items-center gap-1.5">
          <FiSave size={16} />
          <span>Save</span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>


        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <FiUser size={16} className="text-blue-600" />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
