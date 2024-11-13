import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './DancePreference.css';
import { motion } from 'framer-motion';

function DancePreference({ dances, setPreferences }) {
  const sections = ['Unassigned', 'Fixed Positions', 'Start', 'Middle', 'End'];

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Initialize local preferences
  const [localPreferences, setLocalPreferences] = useState({
    Unassigned: dances.map((dance) => ({ name: dance })),
    'Fixed Positions': [],
    Start: [],
    Middle: [],
    End: [],
  });

  useEffect(() => {
    // Update the parent component
    const updatedPreferences = {
      fixedPositions: localPreferences['Fixed Positions'].map((item) => ({
        name: item.name,
        position: item.position,
      })),
      Start: localPreferences.Start.map((item) => item.name),
      Middle: localPreferences.Middle.map((item) => item.name),
      End: localPreferences.End.map((item) => item.name),
    };
    setPreferences(updatedPreferences);
  }, [localPreferences, setPreferences]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Clone local preferences
    const updatedPreferences = { ...localPreferences };

    // Remove from source
    const sourceList = Array.from(updatedPreferences[sourceId]);
    const [movedDance] = sourceList.splice(source.index, 1);
    updatedPreferences[sourceId] = sourceList;

    // Add to destination
    const destList = Array.from(updatedPreferences[destId]);
    destList.splice(destination.index, 0, movedDance);
    updatedPreferences[destId] = destList;

    setLocalPreferences(updatedPreferences);
  };

  const handlePositionChange = (index, position) => {
    setLocalPreferences((prevState) => {
      const updatedFixed = [...prevState['Fixed Positions']];
      updatedFixed[index] = { ...updatedFixed[index], position: parseInt(position) };
      return {
        ...prevState,
        'Fixed Positions': updatedFixed,
      };
    });
  };

  // Generate options for dropdown
  const positionOptions = [];
  for (let i = 1; i <= dances.length; i++) {
    positionOptions.push(i);
  }

  return (
  <DragDropContext onDragEnd={onDragEnd}>
    {/* Sections: Fixed Positions, Start, Middle, End */}
    <div className="sections-container">
      {sections
        .filter((section) => section !== 'Unassigned')
        .map((section, index) => (
          <Droppable key={section} droppableId={section}>
            {(provided, snapshot) => (
              <motion.div
                ref={provided.innerRef}
                className={`droppable-section ${
                  snapshot.isDraggingOver ? 'dragging-over' : ''
                }`}
                {...provided.droppableProps}
                initial="hidden"
                animate="visible"
                variants={sectionVariants}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3>{section}</h3>
                {localPreferences[section].map((danceItem, index) => (
                  <Draggable
                    key={`${danceItem.name}-${index}`}
                    draggableId={`${danceItem.name}-${section}-${index}`}
                    index={index}
                  >
                    {(providedDrag, snapshotDrag) => (
                      <motion.div
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        {...providedDrag.dragHandleProps}
                        className={`draggable-item ${snapshotDrag.isDragging ? 'dragging' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {danceItem.name}
                          {section === 'Fixed Positions' && (
                            <div className="position-select">
                              <label>
                                Position:
                                <select
                                  value={danceItem.position || ''}
                                  onChange={(e) =>
                                    handlePositionChange(index, e.target.value)
                                  }
                                  style={{
                                    padding: '8px',
                                    marginTop: '10px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <option value="" style={{ backgroundColor: '#1e1e1e', color: '#ffffff' }}>
                                    Select
                                  </option>
                                  {positionOptions.map((pos) => (
                                    <option 
                                      key={pos}
                                      value={pos}
                                      style={{ backgroundColor: '#1e1e1e', color: '#ffffff' }}
                                    >
                                      {pos}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </motion.div>
              )}
            </Droppable>
          ))}
      </div>

      {/* Unassigned Dances */}
      <Droppable droppableId="Unassigned" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            className={`unassigned-section ${snapshot.isDraggingOver ? 'dragging-over' : ''
              }`}
            {...provided.droppableProps}
          >
            <h3 style={{ width: '100%' }}>Unassigned</h3>
            {localPreferences['Unassigned'].map((danceItem, index) => (
              <Draggable key={danceItem.name} draggableId={danceItem.name} index={index}>
                {(providedDrag, snapshotDrag) => (
                  <div
                    ref={providedDrag.innerRef}
                    {...providedDrag.draggableProps}
                    {...providedDrag.dragHandleProps}
                    className={`draggable-item unassigned-item ${snapshotDrag.isDragging ? 'dragging' : ''
                      }`}
                  >
                    {danceItem.name}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default DancePreference;
