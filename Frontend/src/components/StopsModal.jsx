import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsBus,
  LocationOn,
  AccessTime,
  ArrowForward,
  Circle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const StopsModal = ({ open, onClose, stops }) => {
  const [selectedType, setSelectedType] = useState('all');
  
  const boardingStops = stops?.filter(stop => stop.stopType === 'boarding') || [];
  const droppingStops = stops?.filter(stop => stop.stopType === 'dropping') || [];
  
  const displayStops = selectedType === 'all' 
    ? stops 
    : stops?.filter(stop => stop.stopType === selectedType) || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 }
      }}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ 
        background: 'linear-gradient(to right, #FFE082, #FFC107)',
        color: '#212121',
        p: 2
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" fontWeight="600" sx={{ color: '#E65100' }}>
            Route Stops
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#E65100' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={`All Stops (${stops?.length || 0})`}
            onClick={() => setSelectedType('all')}
            sx={{
              backgroundColor: selectedType === 'all' ? '#E65100' : 'rgba(230, 81, 0, 0.1)',
              color: selectedType === 'all' ? 'white' : '#E65100',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: selectedType === 'all' ? '#E65100' : 'rgba(230, 81, 0, 0.2)',
              }
            }}
          />
          <Chip
            label={`Boarding (${boardingStops.length})`}
            onClick={() => setSelectedType('boarding')}
            sx={{
              backgroundColor: selectedType === 'boarding' ? '#E65100' : 'rgba(230, 81, 0, 0.1)',
              color: selectedType === 'boarding' ? 'white' : '#E65100',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: selectedType === 'boarding' ? '#E65100' : 'rgba(230, 81, 0, 0.2)',
              }
            }}
          />
          <Chip
            label={`Dropping (${droppingStops.length})`}
            onClick={() => setSelectedType('dropping')}
            sx={{
              backgroundColor: selectedType === 'dropping' ? '#E65100' : 'rgba(230, 81, 0, 0.1)',
              color: selectedType === 'dropping' ? 'white' : '#E65100',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: selectedType === 'dropping' ? '#E65100' : 'rgba(230, 81, 0, 0.2)',
              }
            }}
          />
        </Box>

        <Box 
          sx={{ 
            height: 4, 
            backgroundColor: 'rgba(230, 81, 0, 0.1)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <LinearProgress
            variant="determinate"
            value={(displayStops.length / (stops?.length || 1)) * 100}
            sx={{
              backgroundColor: 'transparent',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#E65100'
              }
            }}
          />
        </Box>
      </Box>

      <DialogContent 
        sx={{ 
          p: 3, 
          maxHeight: '60vh',
          backgroundColor: '#F5F5F5'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <AnimatePresence mode="wait">
            {displayStops.map((stop, index) => (
              <motion.div
                key={stop._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 193, 7, 0.1)',
                      borderColor: '#FFC107',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 193, 7, 0.15)'
                    }
                  }}
                >
                  {/* Background Route Line */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '2.5rem',
                      top: 0,
                      bottom: 0,
                      width: 2,
                      bgcolor: stop.stopType === 'boarding' ? '#FF8F00' : '#E65100',
                      opacity: 0.2
                    }}
                  />

                  <Box display="flex" gap={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: stop.stopType === 'boarding' ? '#FF8F00' : '#E65100',
                        width: 40,
                        height: 40,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {stop.stopType === 'boarding' ? <DirectionsBus /> : <LocationOn />}
                    </Avatar>

                    <Box flex={1}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={600}
                        sx={{ color: '#212121' }}
                      >
                        {stop.stop?.stopName || stop.stopName || "Unknown Stop"}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={2} mt={1}>
                        <Tooltip title="Stop Order" arrow>
                          <Chip
                            icon={<Circle sx={{ fontSize: 12 }} />}
                            label={`Stop ${stop.order}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: stop.stopType === 'boarding' ? '#FF8F00' : '#E65100',
                              color: stop.stopType === 'boarding' ? '#FF8F00' : '#E65100',
                              '& .MuiChip-icon': {
                                color: stop.stopType === 'boarding' ? '#FF8F00' : '#E65100'
                              }
                            }}
                          />
                        </Tooltip>

                        <Tooltip title="Stop Type" arrow>
                          <Chip
                            icon={stop.stopType === 'boarding' ? <DirectionsBus /> : <ArrowForward />}
                            label={stop.stopType === 'boarding' ? 'Boarding Point' : 'Dropping Point'}
                            size="small"
                            sx={{
                              bgcolor: stop.stopType === 'boarding' ? 'rgba(255, 143, 0, 0.1)' : 'rgba(230, 81, 0, 0.1)',
                              color: stop.stopType === 'boarding' ? '#FF8F00' : '#E65100',
                              '& .MuiChip-icon': {
                                color: 'inherit'
                              }
                            }}
                          />
                        </Tooltip>

                        {stop.scheduledTime && (
                          <Tooltip title="Scheduled Time" arrow>
                            <Chip
                              icon={<AccessTime />}
                              label={stop.scheduledTime}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                color: '#212121',
                                borderColor: '#FFC107',
                                '& .MuiChip-icon': {
                                  color: '#FFC107'
                                }
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>

          {displayStops.length === 0 && (
            <Box 
              sx={{ 
                py: 8, 
                textAlign: 'center',
                color: '#212121'
              }}
            >
              <Typography>No stops found for the selected filter</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default StopsModal;