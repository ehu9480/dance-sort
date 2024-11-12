import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function DancePreference({ dances, setPreferences }) {
  const sections = ['Start', 'Middle', 'End'];

  // Initialize preferences with dances unassigned
  const [preferences, setLocalPreferences] = useState({
    Unassigned: dances,
    Start: [],
    Middle: [],
    End: [],
  });

  const onDragEnd = (result) => {
    const { source, destination } = result;

    // Dropped outside a list
    if (!destination) return;

    // Moving the dance between lists
    const sourceList = Array.from(preferences[source.droppableId]);
    const [movedDance] = sourceList.splice(source.index, 1);

    const destList = Array.from(preferences[destination.droppableId]);
    destList.splice(destination.index, 0, movedDance);

    setLocalPreferences((prevState) => ({
      ...prevState,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destList,
    }));

    // Update the parent component with the new preferences
    setPreferences({
      ...preferences,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destList,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {['Unassigned', ...sections].map((section) => (
          <Droppable key={section} droppableId={section}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={{
                  backgroundColor: snapshot.isDraggingOver ? '#e0e0e0' : '#f0f0f0',
                  padding: 8,
                  width: 200,
                  minHeight: 500,
                  margin: '0 8px',
                }}
                {...provided.droppableProps}
              >
                <h3>{section}</h3>
                {preferences[section].map((dance, index) => (
                  <Draggable key={dance} draggableId={dance} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          userSelect: 'none',
                          padding: 8,
                          margin: '0 0 8px 0',
                          backgroundColor: snapshot.isDragging ? '#d0d0d0' : '#ffffff',
                          ...provided.draggableProps.style,
                        }}
                      >
                        {dance}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

export default DancePreference;
