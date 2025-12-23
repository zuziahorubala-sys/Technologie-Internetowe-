export const notFound = (req, res) => res.status(404).json({ error: 'Not found' });
export const errorHandler = (err, req, res, next) => {
  console.error(err); // proste logowanie
  if (err.status && err.message) return res.status(err.status).json({ error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
};
