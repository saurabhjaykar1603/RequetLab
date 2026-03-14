import * as environmentRepository from '../repositories/environmentRepository.js';

export const getEnvironments = async (req, res) => {
  try {
    const environments = await environmentRepository.getAllEnvironments();
    res.json(environments.map(e => ({
      ...e,
      variables: e.variables ? JSON.parse(e.variables) : {}
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEnvironment = async (req, res) => {
  try {
    const { name, variables } = req.body;
    const newEnv = await environmentRepository.createEnvironment(name, variables);
    newEnv.variables = JSON.parse(newEnv.variables);
    res.status(201).json(newEnv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
