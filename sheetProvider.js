// sheetProvider.js
const axios = require('axios');

const SHEET_ID = '1qgiZHiSSGBDSeUi9TLhUIdVm3j75UrkQjXKmy7afhR4';
const SHEET_NAME = 'Sheet1';

const fetchRawData = async () => {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
  const res = await axios.get(url);
  const json = JSON.parse(res.data.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)[1]);

  const headers = json.table.cols.map(col => col.label.toLowerCase());
  const rows = json.table.rows.map(row =>
    headers.reduce((acc, header, i) => {
      acc[header] = row.c[i] ? row.c[i].v : null;
      return acc;
    }, {})
  );

  return rows;
};

async function fetchIndicesList() {
  const rows = await fetchRawData();
  const indexSet = new Set();

  rows.forEach(row => {
    if (row.index) indexSet.add(row.index);
  });

  return Array.from(indexSet).map(name => ({ name }));
}

async function fetchIndexConstituents(indexName, investmentAmount = 100000) {
  const rows = await fetchRawData();
  const filtered = rows.filter(row => row.index === indexName);

  const constituents = filtered.map(row => ({
    name: row.stock,
    symbol: row.symbol,
    weight: parseFloat(row.weight) || 0,
    price: parseFloat(row.price) || 0
  }));

  const totalWeight = constituents.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return [];

  // Initial allocation
  let remaining = investmentAmount;
  constituents.forEach(c => {
    const idealAllocation = (c.weight / totalWeight) * investmentAmount;
    c.shares = Math.floor(idealAllocation / c.price);
    c.allocatedAmount = Math.round(c.shares * c.price);
    remaining -= c.allocatedAmount;
  });

  // Redistribute remaining to highest weight stock(s)
  if (remaining > 0) {
    // Sort by descending weight
    constituents.sort((a, b) => b.weight - a.weight);
    for (let c of constituents) {
      if (remaining < c.price) continue;
      const extraShares = Math.floor(remaining / c.price);
      c.shares += extraShares;
      const added = extraShares * c.price;
      c.allocatedAmount += added;
      remaining -= added;
      if (remaining <= 0) break;
    }
  }

  return {
    name: indexName,
    constituents
  };
}

module.exports = {
  fetchIndicesList,
  fetchIndexConstituents
};