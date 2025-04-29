import React, { useState, useEffect } from 'react';
import { groupBy } from 'lodash';
import './App.css';

function App() {

  const [groupedLists, setGroupedLists] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedLists, setSelectedLists] = useState([]);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newList, setNewList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('https://apis.ccbp.in/list-creation/lists');
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      const grouped = groupBy(data.lists, 'list_number');
      setGroupedLists(grouped);

    } catch (err) {
      setError(true);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckList = (listNumber) => {
    if (selectedLists.includes(listNumber)) {
      setSelectedLists(selectedLists.filter(num => num !== listNumber));
    } else {
      setSelectedLists([...selectedLists, listNumber]);
    }
    setErrorMessage('');
  };

  const handleCreateNewList = () => {
    if (selectedLists.length !== 2) {
      setErrorMessage('You should select exactly 2 lists to create a new list');
      return;
    }
    
    // Sort selected lists to ensure first list is always the one with lower number
    const sortedSelections = [...selectedLists].sort((a, b) => a - b);
    setSelectedLists(sortedSelections);
    setIsCreatingList(true);
    setNewList([]);
  };

  const moveItemToNewList = (item, fromListIndex) => {
    // Remove from original list
    const updatedGroupedLists = {...groupedLists};
    const listNumber = selectedLists[fromListIndex];
    
    updatedGroupedLists[listNumber] = updatedGroupedLists[listNumber].filter(
      listItem => listItem.id !== item.id
    );
    
    // Add to new list
    setNewList([...newList, {...item, originalList: fromListIndex, originalListNumber: listNumber}]);
    setGroupedLists(updatedGroupedLists);
  };

  const moveItemFromNewList = (item) => {
    // Remove from new list
    const updatedNewList = newList.filter(listItem => listItem.id !== item.id);
    setNewList(updatedNewList);
    
    // Add back to original list
    const updatedGroupedLists = {...groupedLists};
    const listNumber = item.originalListNumber;
    
    if (!updatedGroupedLists[listNumber]) {
      updatedGroupedLists[listNumber] = [];
    }
    
    updatedGroupedLists[listNumber].push(item);
    setGroupedLists(updatedGroupedLists);
  };

  const handleCancel = () => {
    // Reset everything to original state
    fetchLists();
    setIsCreatingList(false);
    setSelectedLists([]);
    setNewList([]);
  };

  const handleUpdate = () => {
    const updatedGroupedLists = {...groupedLists};
    

    const listNumbers = Object.keys(updatedGroupedLists).map(Number);
    const newListNumber = Math.max(...listNumbers) + 1;
    

    updatedGroupedLists[newListNumber] = newList.map(item => ({
      ...item, 
      list_number: newListNumber,
      originalList: undefined, 
      originalListNumber: undefined
    }));
    
    setGroupedLists(updatedGroupedLists);
    setIsCreatingList(false);
    setSelectedLists([]);
    setNewList([]);
  };

  if (loading) {
    return <div className="loader">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to fetch data</h2>
        <button onClick={fetchLists}>Try Again</button>
      </div>
    );
  }


  const listNumbers = Object.keys(groupedLists).map(Number).sort((a, b) => a - b);

  return (
    <div className="app-container">
      <h1>List Creation</h1>
      
      {isCreatingList ? (
        <div className="list-creation-view">
          <div className="lists-container">
            <div className="list-container">
              <h3>List {selectedLists[0]}</h3>
              <div className="list-items">
                {groupedLists[selectedLists[0]] && groupedLists[selectedLists[0]].map(item => (
                  <div key={item.id} className="list-item">
                    <div>
                      <div className="item-name">{item.name}</div>
                      <div className="item-scientific-name">{item.scientific_name}</div>
                    </div>
                    <button onClick={() => moveItemToNewList(item, 0)}>→</button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* New list being created */}
            <div className="list-container new-list">
              <h3>New List</h3>
              <div className="list-items">
                {newList.map(item => (
                  <div key={item.id} className="list-item">
                    <button onClick={() => moveItemFromNewList(item)}>←</button>
                    <div>
                      <div className="item-name">{item.name}</div>
                      <div className="item-scientific-name">{item.scientific_name}</div>
                    </div>
                    <button onClick={() => moveItemFromNewList(item)}>→</button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Second selected list */}
            <div className="list-container">
              <h3>List {selectedLists[1]}</h3>
              <div className="list-items">
                {groupedLists[selectedLists[1]] && groupedLists[selectedLists[1]].map(item => (
                  <div key={item.id} className="list-item">
                    <button onClick={() => moveItemToNewList(item, 1)}>←</button>
                    <div>
                      <div className="item-name">{item.name}</div>
                      <div className="item-scientific-name">{item.scientific_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
            <button className="update-button" onClick={handleUpdate}>Update</button>
          </div>
        </div>
      ) : (
        <div className="all-lists-view">
          <button 
            className="create-new-list-button" 
            onClick={handleCreateNewList}
          >
            Create a new list
          </button>
          
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          
          <div className="lists-container">
            {listNumbers.map(listNumber => (
              <div key={listNumber} className="list-container">
                <div className="list-header">
                  <input 
                    type="checkbox" 
                    id={`list-${listNumber}`}
                    checked={selectedLists.includes(listNumber)}
                    onChange={() => handleCheckList(listNumber)}
                  />
                  <label htmlFor={`list-${listNumber}`}>List {listNumber}</label>
                </div>
                
                <div className="list-items">
                  {groupedLists[listNumber] && groupedLists[listNumber].map(item => (
                    <div key={item.id} className="list-item">
                      <div className="item-name">{item.name}</div>
                      <div className="item-scientific-name">{item.scientific_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;