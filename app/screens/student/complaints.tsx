import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Button, Card, FAB, Portal, Dialog, TextInput, SegmentedButtons, Surface, IconButton, Modal, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { useTheme } from '@/app/context/ThemeContext';
import StudentDashboardLayout from '@/app/components/layouts/StudentDashboardLayout';
import { complaintsService, type Complaint, type ComplaintCategory } from '@/app/services/complaints.service';
import { DocumentPicker } from 'expo-document-picker';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';

// Define priority icons and colors
const PRIORITY_CONFIG = {
  low: {
    icon: 'shield-check',
    label: 'Low Priority',
    color: '#4CAF50',
    bgColor: '#E8F5E9'
  },
  medium: {
    icon: 'shield-alert',
    label: 'Medium Priority',
    color: '#FB8C00',
    bgColor: '#FFF3E0'
  },
  high: {
    icon: 'shield-bug',
    label: 'High Priority',
    color: '#E53935',
    bgColor: '#FFEBEE'
  }
};

// Define complaint categories with better icons
const COMPLAINT_CATEGORIES = [
  { 
    key: 1, 
    label: 'Maintenance', 
    icon: 'hammer-wrench',
    color: '#1E88E5',
    bgColor: '#E3F2FD'
  },
  { 
    key: 2, 
    label: 'Cleanliness', 
    icon: 'spray-bottle',
    color: '#43A047',
    bgColor: '#E8F5E9'
  },
  { 
    key: 3, 
    label: 'Security', 
    icon: 'security',
    color: '#E53935',
    bgColor: '#FFEBEE'
  },
  { 
    key: 4, 
    label: 'Food', 
    icon: 'silverware-fork-knife',
    color: '#FB8C00',
    bgColor: '#FFF3E0'
  },
  { 
    key: 5, 
    label: 'Internet', 
    icon: 'wifi-strength-4',
    color: '#00ACC1',
    bgColor: '#E0F7FA'
  },
  { 
    key: 6, 
    label: 'Noise', 
    icon: 'volume-vibrate',
    color: '#8E24AA',
    bgColor: '#F3E5F5'
  },
  { 
    key: 7, 
    label: 'Roommate', 
    icon: 'account-group',
    color: '#3949AB',
    bgColor: '#E8EAF6'
  },
  { 
    key: 8, 
    label: 'Other', 
    icon: 'dots-horizontal-circle',
    color: '#757575',
    bgColor: '#FAFAFA'
  },
];

// Update the styles
const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  cardGlass: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  modalGlass: {
    margin: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    padding: 20,
  },
  categoryButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingVertical: 4,
  },
  attachmentsSection: {
    marginBottom: 24,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attachmentButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  selectedFiles: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
  },
  categoryOption: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryPreview: {
    marginBottom: 24,
  },
  selectedCategory: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
  },
  categoryHint: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    borderRadius: 8,
    minWidth: 80,
  },
});

// Define complaint icons based on categories
const COMPLAINT_ICONS: { [key: string]: string } = {
  'Maintenance': 'tools',
  'Cleanliness': 'broom',
  'Security': 'shield-account',
  'Food': 'food',
  'Internet': 'wifi',
  'Noise': 'volume-high',
  'Roommate': 'account-group',
  'Other': 'alert-circle',
};

export default function ComplaintsScreen() {
  const { theme } = useTheme();
  const { student, isAuthenticated } = useStudentAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>();
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [touchedFields, setTouchedFields] = useState({
    title: false,
    description: false,
  });

  const loadComplaints = async () => {
    try {
      if (!isAuthenticated || !student) {
        console.warn('Student is not authenticated');
        return;
      }
      setLoading(true);
      setError(null);
      console.log('Loading complaints for student:', student);
      const response = await complaintsService.getMyComplaints();
      console.log('Complaints loaded:', response);
      setComplaints(response);
    } catch (err: any) {
      console.error('Error loading complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      if (!isAuthenticated || !student) {
        console.warn('Student is not authenticated');
        return;
      }
      console.log('Loading categories');
      const response = await complaintsService.getCategories();
      console.log('Categories loaded:', response);
      setCategories(response);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setError(error.message || 'Failed to load categories');
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && student) {
        loadComplaints();
        loadCategories();
      }
    }, [isAuthenticated, student])
  );

  const handleSubmit = async () => {
    if (!student) return;

    // Frontend validation
    if (title.length < 5 || title.length > 100) {
      setError('Title must be between 5 and 100 characters');
      return;
    }

    if (description.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await complaintsService.submitComplaint({
        pgId: student.pgId,
        tenantId: student.TenantID,
        categoryId,
        title,
        description,
        priority,
        isEmergency: priority === 'high',
        attachments: selectedFiles
      });

      setShowSuccess(true);
      setDialogVisible(false);
      resetForm();
      await loadComplaints();
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
      });
      
      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
        }));
        setSelectedFiles([...selectedFiles, ...newFiles]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to pick document');
    }
  };

  const pickImage = async () => {
    try {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => ({
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
        }));
        setSelectedFiles([...selectedFiles, ...newFiles]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId(undefined);
    setPriority('medium');
    setSelectedFiles([]);
    setTouchedFields({ title: false, description: false });
  };

  const renderCategoryOption = (category: typeof COMPLAINT_CATEGORIES[0]) => {
    const isSelected = categoryId === category.key;
  return (
      <Surface
        key={category.key}
        style={[
          staticStyles.categoryOption,
          {
            backgroundColor: isSelected 
              ? `${category.color}15`
              : theme.colors.surface,
            borderColor: isSelected ? category.color : 'transparent',
            borderWidth: 2,
          }
        ]}
        elevation={1}
      >
        <View style={[
          staticStyles.categoryIcon,
          {
            backgroundColor: isSelected
              ? `${category.color}20`
              : `${theme.colors.surfaceVariant}80`,
          }
        ]}>
          <MaterialCommunityIcons
            name={category.icon}
            size={28}
            color={isSelected ? category.color : theme.colors.onSurfaceVariant}
          />
        </View>
        <Text 
            style={[
            staticStyles.categoryOptionLabel,
            { color: isSelected ? category.color : theme.colors.onSurfaceVariant }
          ]}
          numberOfLines={1}
        >
          {category.label}
        </Text>
      </Surface>
    );
  };

  // Add validation on input change
  const validateTitle = (text: string) => {
    setTitle(text);
    if (touchedFields.title) {
      if (text.length < 5 || text.length > 100) {
        setError('Title must be between 5 and 100 characters');
      } else {
        setError(null);
      }
    }
  };

  const validateDescription = (text: string) => {
    setDescription(text);
    if (touchedFields.description) {
      if (text.length < 10) {
        setError('Description must be at least 10 characters long');
      } else {
        setError(null);
      }
    }
  };

  const getFilteredComplaints = () => {
    return complaints.filter(complaint => {
      switch (activeFilter) {
        case 'Active':
          return complaint.status !== 'resolved';
        case 'Resolved':
          return complaint.status === 'resolved';
        case 'High Priority':
          return complaint.priority === 'high' || complaint.isEmergency;
        default:
          return true;
      }
    });
  };

  return (
    <StudentDashboardLayout title="Complaints">
      <View style={[staticStyles.container, { backgroundColor: theme.colors.background }]}>
        {/* Filters */}
        <View style={staticStyles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', 'Active', 'Resolved', 'High Priority'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  staticStyles.filterButton,
                  {
                    backgroundColor: filter === activeFilter 
                      ? theme.colors.primary 
                      : `${theme.colors.surfaceVariant}80`,
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    filter === 'All' ? 'view-list'
                    : filter === 'Active' ? 'clock-outline'
                    : filter === 'Resolved' ? 'check-circle'
                    : 'alert-circle'
                  }
                  size={18}
                  color={filter === activeFilter ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                />
                <Text style={[
                  staticStyles.filterButtonText,
                  { color: filter === activeFilter ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <ScrollView>
              {getFilteredComplaints().map((complaint) => {
                const category = COMPLAINT_CATEGORIES.find(c => c.key === complaint.categoryId);
                const priority = PRIORITY_CONFIG[complaint.priority as keyof typeof PRIORITY_CONFIG];
                const isEmergency = complaint.priority === 'high' || complaint.isEmergency;

                return (
                  <Surface
                    key={`complaint-${complaint.complaintId}`}
            style={[
                      staticStyles.complaintCard,
                      staticStyles.cardGlass,
                      {
                        borderColor: isEmergency 
                          ? `${theme.colors.error}30`
                          : `${theme.colors.outline}20`,
                        backgroundColor: isEmergency
                          ? `${theme.colors.errorContainer}20`
                          : `${theme.colors.surface}F0`,
                      }
                    ]}
                  >
                    <View style={staticStyles.cardContent}>
                      <View style={staticStyles.cardHeader}>
                        <View style={[
                          staticStyles.iconContainer,
                          {
                            backgroundColor: category?.bgColor || theme.colors.surfaceVariant,
                            borderColor: category?.color || theme.colors.outline,
                            borderWidth: 2,
                          }
                        ]}>
                      <MaterialCommunityIcons
                            name={category?.icon || 'alert-circle'}
                            size={32}
                            color={category?.color || theme.colors.onSurfaceVariant}
                      />
                    </View>
                        
                        <View style={staticStyles.titleContainer}>
                          <Text style={[
                            staticStyles.title,
                            { color: theme.colors.onSurface }
                          ]}>
                        {complaint.title}
                      </Text>
                          <Text style={[
                            staticStyles.timestamp,
                            { color: theme.colors.onSurfaceVariant }
                          ]}>
                            {format(new Date(complaint.createdAt), 'PPp')}
                        </Text>
                      </View>
                    </View>

                      <View style={staticStyles.statusContainer}>
                        <Surface
                          style={[
                            staticStyles.badge,
                            {
                              backgroundColor: 
                                complaint.status === 'resolved'
                                  ? `${theme.colors.primary}15`
                                  : complaint.status === 'in_progress'
                                  ? `${theme.colors.secondary}15`
                                  : `${theme.colors.surfaceVariant}50`,
                            }
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              complaint.status === 'resolved'
                                ? 'check-circle'
                                : complaint.status === 'in_progress'
                                ? 'progress-clock'
                                : 'information'
                            }
                            size={18}
                            color={
                              complaint.status === 'resolved'
                                ? theme.colors.primary
                                : complaint.status === 'in_progress'
                                ? theme.colors.secondary
                                : theme.colors.onSurfaceVariant
                            }
                          />
                          <Text style={[
                            staticStyles.badgeText,
                            {
                              color: 
                                complaint.status === 'resolved'
                                  ? theme.colors.primary
                                  : complaint.status === 'in_progress'
                                  ? theme.colors.secondary
                                  : theme.colors.onSurfaceVariant
                            }
                          ]}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </Surface>

                        <Surface
                          style={[
                            staticStyles.badge,
                            { backgroundColor: `${priority.color}15` }
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={priority.icon}
                            size={18}
                            color={priority.color}
                          />
                          <Text style={[
                            staticStyles.badgeText,
                            { color: priority.color }
                          ]}>
                            {priority.label}
                          </Text>
                        </Surface>
                </View>
                
                      <Text style={[
                        staticStyles.description,
                        { color: theme.colors.onSurfaceVariant }
                      ]}>
                  {complaint.description}
                </Text>
                      </View>
                  </Surface>
                );
              })}
      </ScrollView>

      <FAB
        icon="plus"
        label="New Complaint"
              style={[
                staticStyles.fab,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setDialogVisible(true)}
            />

      <Portal>
        <Modal
                visible={dialogVisible}
                onDismiss={() => setDialogVisible(false)}
          contentContainerStyle={[
                  staticStyles.modalContainer,
                  staticStyles.modalGlass,
                ]}
              >
                <View style={[
                  staticStyles.modalHeader,
                  { borderBottomColor: `${theme.colors.outline}20` }
                ]}>
                  <Text style={[
                    staticStyles.modalTitle,
                    { color: theme.colors.onSurface }
                  ]}>
              New Complaint
            </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setDialogVisible(false)}
                  />
                </View>

                <ScrollView 
                  style={staticStyles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={[
                    staticStyles.sectionTitle,
                    { color: theme.colors.onSurface }
                  ]}>
                    Select Category
                  </Text>
                  <View style={staticStyles.categoryPreview}>
                    <Surface 
                      style={[
                        staticStyles.selectedCategory,
                        { backgroundColor: theme.colors.surface }
                      ]} 
                      elevation={1}
                    >
                      {categoryId ? (
                        <>
                          <View style={[
                            staticStyles.categoryIcon,
                            {
                              backgroundColor: `${theme.colors.primary}20`,
                              width: 64,
                              height: 64,
                              borderRadius: 32,
                            }
                          ]}>
                            <MaterialCommunityIcons
                              name={COMPLAINT_CATEGORIES.find(c => c.key === categoryId)?.icon || 'help-circle'}
                              size={32}
                              color={theme.colors.primary}
                            />
                          </View>
                          <Text style={[
                            staticStyles.categoryHint,
                            { color: theme.colors.onSurface }
                          ]}>
                            {COMPLAINT_CATEGORIES.find(c => c.key === categoryId)?.label}
                          </Text>
                        </>
                      ) : (
                        <>
                          <IconButton
                            icon="shape-outline"
                            size={32}
                            iconColor={theme.colors.primary}
                            style={{ backgroundColor: `${theme.colors.primary}20` }}
                            onPress={() => setShowCategoryModal(true)}
                          />
                          <Text style={[
                            staticStyles.categoryHint,
                            { color: theme.colors.onSurfaceVariant }
                          ]}>
                            Tap to select category
                          </Text>
                        </>
                      )}
                    </Surface>
                  </View>

                  <Text style={[
                    staticStyles.sectionTitle,
                    { color: theme.colors.onSurface }
                  ]}>
                    Complaint Details
                  </Text>
            <TextInput
                    label="Title"
                    value={title}
                    onChangeText={validateTitle}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, title: true }))}
                    mode="outlined"
                    style={staticStyles.input}
                    outlineStyle={[
                      staticStyles.inputOutline,
                      { 
                        borderColor: touchedFields.title && (title.length < 5 || title.length > 100)
                          ? theme.colors.error
                          : theme.colors.outline 
                      }
                    ]}
                    placeholder="Enter complaint title"
                  />
                  <TextInput
              label="Description"
                    value={description}
                    onChangeText={validateDescription}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, description: true }))}
                    mode="outlined"
              multiline
              numberOfLines={4}
                    style={staticStyles.input}
                    outlineStyle={[
                      staticStyles.inputOutline,
                      { 
                        borderColor: touchedFields.description && description.length < 10
                          ? theme.colors.error
                          : theme.colors.outline 
                      }
                    ]}
                    placeholder="Describe your complaint in detail"
                  />

                  <Text style={[
                    staticStyles.sectionTitle,
                    { color: theme.colors.onSurface }
                  ]}>
                    Set Priority Level
                  </Text>
                  <View style={staticStyles.priorityContainer}>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                      const isSelected = priority === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => setPriority(key as 'low' | 'medium' | 'high')}
                          style={[
                            staticStyles.priorityButton,
                            {
                              backgroundColor: isSelected
                                ? `${config.color}15`
                                : `${theme.colors.surfaceVariant}50`,
                              borderColor: isSelected
                                ? config.color
                                : 'transparent',
                            }
                          ]}
                        >
                          <View style={[
                            staticStyles.priorityIcon,
                            {
                              backgroundColor: isSelected
                                ? `${config.color}20`
                                : `${theme.colors.surfaceVariant}80`,
                            }
                          ]}>
                            <MaterialCommunityIcons
                              name={config.icon}
                              size={24}
                              color={isSelected ? config.color : theme.colors.onSurfaceVariant}
                            />
              </View>
                          <Text
                    style={[
                              staticStyles.priorityLabel,
                              {
                                color: isSelected ? config.color : theme.colors.onSurfaceVariant
                              }
                            ]}
                            numberOfLines={1}
                          >
                            {config.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
              </View>

                  <Text style={[
                    staticStyles.sectionTitle,
                    { color: theme.colors.onSurface }
                  ]}>
                    Attachments (Optional)
                  </Text>
                  <View style={staticStyles.attachmentsSection}>
                    <View style={staticStyles.attachmentButtons}>
              <Button 
                mode="outlined" 
                        icon="file-document"
                        onPress={pickDocument}
                        style={[
                          staticStyles.attachmentButton,
                          { borderColor: theme.colors.outline }
                        ]}
                      >
                        Add Document
                      </Button>
                      <Button
                        mode="outlined"
                        icon="image"
                onPress={pickImage}
                        style={[
                          staticStyles.attachmentButton,
                          { borderColor: theme.colors.outline }
                        ]}
              >
                        Add Image
              </Button>
                    </View>
                    
                    {selectedFiles.length > 0 && (
                      <View style={staticStyles.selectedFiles}>
                        {selectedFiles.map((file, index) => (
                          <View 
                            key={`${file.name}-${index}`}
                            style={[
                              staticStyles.fileItem,
                              { backgroundColor: `${theme.colors.surfaceVariant}50` }
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={file.type?.includes('image') ? 'image' : 'file-document'}
                              size={20}
                              color={theme.colors.primary}
                            />
                            <Text 
                              style={[
                                staticStyles.fileName,
                                { color: theme.colors.onSurface }
                              ]}
                              numberOfLines={1}
                            >
                              {file.name}
                            </Text>
                            <IconButton
                              icon="close-circle"
                              size={20}
                              iconColor={theme.colors.error}
                              onPress={() => removeFile(index)}
                              style={staticStyles.removeButton}
                            />
                          </View>
                  ))}
                </View>
              )}
            </View>

              <Button 
                mode="contained" 
                    onPress={handleSubmit}
                    loading={submitting}
                    style={[
                      staticStyles.submitButton,
                      { backgroundColor: theme.colors.primary }
                    ]}
                    labelStyle={staticStyles.submitLabel}
                    disabled={!title.trim() || !description.trim() || !categoryId}
                  >
                    Submit Complaint
              </Button>
          </ScrollView>
        </Modal>

        <Modal
                visible={showCategoryModal}
                onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[
                  staticStyles.modal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
                <View style={staticStyles.modalHeader}>
                  <Text style={[staticStyles.modalTitle, { color: theme.colors.onSurface }]}>
                    Select Category
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setShowCategoryModal(false)}
                  />
                </View>
            <ScrollView>
                  <View style={staticStyles.categoryGrid}>
                    {COMPLAINT_CATEGORIES.map(category => (
                      <TouchableOpacity
                        key={category.key}
                  onPress={() => {
                          setCategoryId(category.key);
                          setShowCategoryModal(false);
                        }}
                        style={[
                          staticStyles.categoryOption,
                          {
                            backgroundColor: categoryId === category.key 
                              ? `${category.color}15`
                              : theme.colors.surface,
                            borderColor: categoryId === category.key ? category.color : theme.colors.outline,
                            borderWidth: 1.5,
                          }
                        ]}
                      >
                        <View style={[
                          staticStyles.categoryIcon,
                          {
                            backgroundColor: categoryId === category.key
                              ? `${category.color}20`
                              : `${theme.colors.surfaceVariant}80`,
                          }
                        ]}>
                          <MaterialCommunityIcons
                            name={category.icon}
                            size={28}
                            color={categoryId === category.key ? category.color : theme.colors.onSurfaceVariant}
                          />
                        </View>
                        <Text 
                          style={[
                            staticStyles.categoryOptionLabel,
                            { color: categoryId === category.key ? category.color : theme.colors.onSurfaceVariant }
                          ]}
                          numberOfLines={1}
                        >
                          {category.label}
            </Text>
                      </TouchableOpacity>
                    ))}
            </View>
                </ScrollView>
                <View style={staticStyles.modalFooter}>
                  <Button
              mode="outlined"
                    onPress={() => setShowCategoryModal(false)}
                    style={[staticStyles.modalButton, { borderColor: theme.colors.outline }]}
                  >
                    Cancel
                  </Button>
              <Button 
                    mode="outlined"
                    onPress={() => setShowCategoryModal(false)}
                    style={[staticStyles.modalButton, { borderColor: theme.colors.primary }]}
                    textColor={theme.colors.primary}
                  >
                    Save
              </Button>
            </View>
        </Modal>
      </Portal>
          </>
        )}

        <Snackbar
          visible={!!error}
          onDismiss={() => setError(null)}
          duration={3000}
          style={{ backgroundColor: theme.colors.error }}
        >
          {error}
        </Snackbar>

        <Snackbar
          visible={showSuccess}
          onDismiss={() => setShowSuccess(false)}
          duration={3000}
          style={{ backgroundColor: theme.colors.primary }}
        >
          Complaint submitted successfully
        </Snackbar>
    </View>
    </StudentDashboardLayout>
  );
} 