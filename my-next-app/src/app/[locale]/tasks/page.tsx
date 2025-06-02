'use client';

import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useTranslations } from 'next-intl';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { GraphQLClient, gql } from 'graphql-request';

// Define types similar to GraphQL schema for type safety
interface Task {
  id: string;
  title: string;
  assigneeId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  deadline?: string;
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

interface TaskEdge {
  node: Task;
  cursor: string;
}

interface TaskConnection {
  edges: TaskEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

const GQL_ENDPOINT = '/api/graphql';
const client = new GraphQLClient(GQL_ENDPOINT);

const GET_TASKS_QUERY = gql`
  query GetTasks($first: Int, $after: String, $last: Int, $before: String) {
    tasks(first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          title
          assigneeId
          status
          deadline
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export default function TasksPage() {
  const t = useTranslations('TasksPage');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFetchParams, setCurrentFetchParams] = useState<{ first: number; after?: string; last?: number; before?: string }>({ first: 5 });

  const fetchTasks = useCallback(async (variables: { first?: number; after?: string; last?: number; before?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data: { tasks: TaskConnection } = await client.request(GET_TASKS_QUERY, variables);
      setTasks(data.tasks.edges.map(edge => edge.node));
      setPageInfo(data.tasks.pageInfo);
    } catch (err) { // Changed from err: any
      if (err instanceof Error) {
        setError(err.message || t('errorFetchingTasks'));
      } else {
        setError(t('errorFetchingTasks'));
      }
      setTasks([]);
      setPageInfo(null);
    } finally {
      setLoading(false);
    }
  }, [t]); // Added t to useCallback dependencies

  useEffect(() => {
    fetchTasks(currentFetchParams);
  }, [currentFetchParams, fetchTasks]); // Added fetchTasks to useEffect dependencies

  const handleNext = () => {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) {
      setCurrentFetchParams({ first: 5, after: pageInfo.endCursor });
    }
  };

  const handlePrevious = () => {
    if (pageInfo?.hasPreviousPage && pageInfo.startCursor) {
      // Provide 'first' to satisfy the state type, even if mock doesn't fully use 'before'
      setCurrentFetchParams({ first: 5, last: 5, before: pageInfo.startCursor });
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tasks table">
          <TableHead>
            <TableRow>
              <TableCell>{t('columnTitle')}</TableCell>
              <TableCell>{t('columnAssignee')}</TableCell>
              <TableCell>{t('columnStatus')}</TableCell>
              <TableCell>{t('columnDeadline')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t('noTasks')}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell component="th" scope="row">{task.title}</TableCell>
                  <TableCell>{task.assigneeId || t('unassigned')}</TableCell>
                  <TableCell>{t(task.status.toLowerCase())}</TableCell>
                  <TableCell>{task.deadline || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="contained"
          onClick={handlePrevious}
          disabled={!pageInfo?.hasPreviousPage || loading}
        >
          {t('previousButton')}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!pageInfo?.hasNextPage || loading}
        >
          {t('nextButton')}
        </Button>
      </Box>
    </Container>
  );
}
