import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Paper, Typography, TextField } from '@mui/material';

function DancePreference({ dances, setPreferences }) {
  const sections = ['Unassigned', 'Fixed Positions', 'Start', 'Middle', 'End'];

  // Initialize preferences with dances unassigned
  const [localPreferences, setLocalPreferences] = useState({
    Unassigned: dances,
    'Fixed Positions': [],
    Start: [],
    Middle: [],
    End: [],
  });

  useEffect(() => {
    // Whenever localPreferences change, update the parent component
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

    // Dropped outside a list
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Moving the dance between lists
    const sourceList = Array.from(localPreferences[sourceId]);
    const destList = Array.from(localPreferences[destId]);

    // Remove the dance from the source
    const [movedDance] = sourceList.splice(source.index, 1);

    // Add the dance to the destination
    destList.splice(destination.index, 0, movedDance);

    // Update the state
    setLocalPreferences((prevState) => ({
      ...prevState,
      [sourceId]: sourceList,
      [destId]: destList,
    }));
  };

  // Function to handle position changes in "Fixed Positions"
  const handlePositionChange = (index, position) => {
    setLocalPreferences((prevState) => {
      const updatedFixed = [...prevState['Fixed Positions']];
      updatedFixed[index] = {
        name: updatedFixed[index],
        position: position,
      };
      return {
        ...prevState,
        'Fixed Positions': updatedFixed,
      };
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {sections.map((section) => (
          <Droppable key={section} droppableId={section}>
            {(provided, snapshot) => (
              <Paper
                ref={provided.innerRef}
                style={{
                  backgroundColor: snapshot.isDraggingOver ? '#e0e0e0' : '#f5f5f5',
                  padding: '16px',
                  minWidth: '200px',
                  flex: '1 1 200px',
                }}
                {...provided.droppableProps}
              >
                <Typography variant="h6">{section}</Typography>
                {localPreferences[section].map((danceItem, index) => {
                  const danceName = typeof danceItem === 'string' ? danceItem : danceItem.name;

                  return (
                    <Draggable key={`${danceName}-${section}`} draggableId={`${danceName}-${section}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            userSelect: 'none',
                            padding: '8px',
                            margin: '8px 0',
                            backgroundColor: snapshot.isDragging ? '#d0d0d0' : '#ffffff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <Typography variant="body1">{danceName}</Typography>
                          {section === 'Fixed Positions' && (
                            <div style={{ marginTop: '8px' }}>
                              <TextField
                                label="Position"
                                type="number"
                                variant="outlined"
                                size="small"
                                value={danceItem.position || ''}
                                onChange={(e) => handlePositionChange(index, parseInt(e.target.value))}
                                InputProps={{ inputProps: { min: 1, max: dances.length } }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </Paper>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

export default DancePreference;