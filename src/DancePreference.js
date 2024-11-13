import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function DancePreference({ dances, setPreferences }) {
  const sections = ['Unassigned', 'Fixed Positions', 'Start', 'Middle', 'End'];

  // Initialize local preferences
  const [localPreferences, setLocalPreferences] = useState({
    Unassigned: dances,
    'Fixed Positions': [], // List of { name: danceName, position: number }
    Start: [],
    Middle: [],
    End: [],
  });

  useEffect(() => {
    // Update the parent component
    const updatedPreferences = {
      fixedPositions: localPreferences['Fixed Positions'],
      Start: localPreferences.Start,
      Middle: localPreferences.Middle,
      End: localPreferences.End,
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

    // For Fixed Positions, add an object with position
    if (destId === 'Fixed Positions') {
      destList.splice(destination.index, 0, { name: movedDance, position: null });
    } else {
      destList.splice(destination.index, 0, movedDance);
    }
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {sections.filter(section => section !== 'Unassigned').map((section) => (
          <Droppable key={section} droppableId={section}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={{
                  backgroundColor: snapshot.isDraggingOver ? '#e0e0e0' : '#f5f5f5',
                  padding: '8px',
                  minHeight: '100px',
                  flex: '1',
                }}
                {...provided.droppableProps}
              >
                <h3>{section}</h3>
                {localPreferences[section].map((danceItem, index) => {
                  const danceName = danceItem.name || danceItem; // For Fixed Positions, danceItem may be an object
                  return (
                    <Draggable
                      key={`${danceName}-${section}`}
                      draggableId={`${danceName}-${section}`}
                      index={index}
                    >
                      {(providedDrag, snapshotDrag) => (
                        <div
                          ref={providedDrag.innerRef}
                          {...providedDrag.draggableProps}
                          {...providedDrag.dragHandleProps}
                          style={{
                            userSelect: 'none',
                            padding: '8px',
                            margin: '8px 0',
                            backgroundColor: snapshotDrag.isDragging ? '#d0d0d0' : '#ffffff',
                            border: '1px solid #ccc',
                            ...providedDrag.draggableProps.style,
                          }}
                        >
                          {danceName}
                          {section === 'Fixed Positions' && (
                            <div style={{ marginTop: '8px' }}>
                              <label>
                                Position:
                                <select
                                  value={danceItem.position || ''}
                                  onChange={(e) => handlePositionChange(index, e.target.value)}
                                  style={{ marginLeft: '8px' }}
                                >
                                  <option value="">Select</option>
                                  {positionOptions.map((pos) => (
                                    <option key={pos} value={pos}>
                                      {pos}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>

      {/* Unassigned Dances */}
      <Droppable droppableId="Unassigned" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            style={{
              backgroundColor: snapshot.isDraggingOver ? '#e0e0e0' : '#f5f5f5',
              padding: '16px',
              minHeight: '100px',
              marginTop: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
            {...provided.droppableProps}
          >
            <h3 style={{ width: '100%' }}>Unassigned</h3>
            {localPreferences['Unassigned'].map((danceName, index) => (
              <Draggable
                key={danceName}
                draggableId={danceName}
                index={index}
              >
                {(providedDrag, snapshotDrag) => (
                  <div
                    ref={providedDrag.innerRef}
                    {...providedDrag.draggableProps}
                    {...providedDrag.dragHandleProps}
                    style={{
                      userSelect: 'none',
                      padding: '8px',
                      backgroundColor: snapshotDrag.isDragging ? '#d0d0d0' : '#ffffff',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      ...providedDrag.draggableProps.style,
                    }}
                  >
                    {danceName}
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
